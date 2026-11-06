import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config.js';
import { DocumentRecord, PageRecord } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { chunkDocumentPages } from '../chunking/textSplitter.js';
import { embeddingService } from '../chunking/embeddingService.js';
import { chromaService } from '../vectorstore/chromaService.js';
import { parsePdfBuffer } from './pdfParser.js';
import { prisma } from '../../db.js';

class DocumentService {
  private documents: Map<string, DocumentRecord> = new Map();
  private documentPages: Map<string, PageRecord[]> = new Map();
  private dataFilePath = path.join(config.uploadDir, 'documents_meta.json');

  async init(): Promise<void> {
    try {
      await fs.mkdir(config.uploadDir, { recursive: true });
      const raw = await fs.readFile(this.dataFilePath, 'utf-8').catch(() => null);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const doc of parsed) {
          this.documents.set(doc.documentId, doc);
        }
        logger.info(`Loaded ${this.documents.size} existing document metadata records.`);
      }

      // Also sync from PostgreSQL if available
      try {
        const dbResources = await prisma.resource.findMany();
        for (const r of dbResources) {
          if (!this.documents.has(r.id)) {
            this.documents.set(r.id, {
              documentId: r.id,
              classroomId: r.classroomId,
              fileName: r.fileName,
              fileSize: r.fileSize,
              uploadTime: r.createdAt.toISOString(),
              pageCount: r.pageCount,
              status: r.indexStatus.toLowerCase() as any,
              emptyPageCount: 0,
              warnings: r.warnings ? JSON.parse(r.warnings) : [],
              checksum: r.checksum,
            });
          }
        }
      } catch {
        // DB sync is best-effort on boot
      }
    } catch (err: any) {
      logger.warn(`Could not load existing document records: ${err.message}`);
    }
  }

  private async persistMeta(): Promise<void> {
    try {
      const list = Array.from(this.documents.values());
      await fs.writeFile(this.dataFilePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      logger.error(`Failed to persist document metadata: ${err.message}`);
    }
  }

  /**
   * Processes an uploaded PDF file:
   * 1. Validates content and computes checksum (prevent duplicate vectors).
   * 2. Extracts pages with page metadata.
   * 3. Chunks pages into overlapping fragments with complete source metadata.
   * 4. Embeds chunks and saves into vector store.
   * 5. Syncs to PostgreSQL resources.
   */
  async processUploadedFile(file: Express.Multer.File, classroomId?: string): Promise<DocumentRecord> {
    const buffer = file.buffer;
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check duplicate (FR-1.5, RES-8)
    for (const doc of this.documents.values()) {
      if (
        doc.checksum === checksum &&
        doc.status === 'ready' &&
        (!classroomId || doc.classroomId === classroomId)
      ) {
        logger.info(`Duplicate file detected: "${file.originalname}" matches existing document ID ${doc.documentId}. Skipping re-indexing.`);
        return doc;
      }
    }

    const documentId = uuidv4();
    const docRecord: DocumentRecord = {
      documentId,
      classroomId,
      fileName: file.originalname,
      fileSize: file.size,
      uploadTime: new Date().toISOString(),
      pageCount: 0,
      status: 'indexing',
      emptyPageCount: 0,
      warnings: [],
      checksum,
    };

    this.documents.set(documentId, docRecord);
    await this.persistMeta();

    try {
      // Step 1: Parse PDF
      const { pages, totalPageCount, emptyPageCount, warnings } = await parsePdfBuffer(buffer, file.originalname);
      this.documentPages.set(documentId, pages);
      await fs.writeFile(
        path.join(config.uploadDir, `pages_${documentId}.json`),
        JSON.stringify(pages),
        'utf-8'
      ).catch((err) => logger.warn(`Could not persist page texts: ${err.message}`));

      docRecord.pageCount = totalPageCount;
      docRecord.emptyPageCount = emptyPageCount;
      docRecord.warnings = warnings;

      // Step 2: Chunk pages with metadata
      const chunks = chunkDocumentPages(documentId, file.originalname, pages);
      if (classroomId) {
        chunks.forEach((c) => {
          c.classroomId = classroomId;
        });
      }
      logger.info(`Generated ${chunks.length} chunks for "${file.originalname}".`);

      if (chunks.length > 0) {
        // Step 3: Embed chunks
        const texts = chunks.map(c => c.text);
        const embeddings = await embeddingService.getEmbeddings(texts);

        // Step 4: Upsert into ChromaDB with classroom isolation
        await chromaService.upsertChunks(chunks, embeddings, classroomId);
      }

      docRecord.status = 'ready';
      this.documents.set(documentId, docRecord);
      await this.persistMeta();

      // Step 5: Sync to PostgreSQL
      if (classroomId) {
        try {
          await prisma.resource.create({
            data: {
              id: documentId,
              classroomId,
              title: file.originalname.replace(/\.pdf$/i, ''),
              fileName: file.originalname,
              filePath: path.join(config.uploadDir, `pages_${documentId}.json`),
              fileSize: file.size,
              pageCount: totalPageCount,
              checksum,
              state: 'PUBLISHED',
              indexStatus: 'READY',
              warnings: JSON.stringify(warnings),
            },
          });
        } catch (dbErr: any) {
          logger.warn(`Could not persist resource to PostgreSQL: ${dbErr.message}`);
        }
      }

      logger.info(`Document "${file.originalname}" (${documentId}) successfully indexed and ready.`);
      return docRecord;
    } catch (error: any) {
      docRecord.status = 'failed';
      docRecord.errorMessage = error.message;
      this.documents.set(documentId, docRecord);
      await this.persistMeta();
      throw error;
    }
  }

  getDocuments(classroomId?: string): DocumentRecord[] {
    const list = Array.from(this.documents.values());
    const filtered = classroomId
      ? list.filter((d) => d.classroomId === classroomId || !d.classroomId)
      : list;

    return filtered.sort(
      (a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    );
  }

  getDocument(documentId: string): DocumentRecord | undefined {
    return this.documents.get(documentId);
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    // 1. Delete from vector store
    await chromaService.deleteDocumentChunks(documentId);

    // 2. Remove persisted pages file
    const pagesFile = path.join(config.uploadDir, `pages_${documentId}.json`);
    await fs.unlink(pagesFile).catch(() => {});

    // 3. Remove from PostgreSQL
    try {
      await prisma.resource.deleteMany({ where: { id: documentId } });
    } catch {}

    // 4. Remove from in-memory index
    this.documents.delete(documentId);
    this.documentPages.delete(documentId);
    await this.persistMeta();

    logger.info(`Deleted document ${documentId} ("${doc.fileName}") and its vector embeddings.`);
    return true;
  }

  async getPageText(documentId: string, pageNumber: number): Promise<PageRecord | null> {
    let pages = this.documentPages.get(documentId);

    if (!pages) {
      try {
        const pagesFile = path.join(config.uploadDir, `pages_${documentId}.json`);
        const data = await fs.readFile(pagesFile, 'utf-8');
        pages = JSON.parse(data);
        if (pages) {
          this.documentPages.set(documentId, pages);
        }
      } catch (err: any) {
        logger.warn(`Could not load page text from disk for ${documentId}: ${err.message}`);
        return null;
      }
    }

    if (!pages) return null;
    const page = pages.find(p => p.pageNumber === pageNumber);
    return page || null;
  }
}

export const documentService = new DocumentService();
