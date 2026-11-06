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
   */
  async processUploadedFile(file: Express.Multer.File): Promise<DocumentRecord> {
    const buffer = file.buffer;
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check duplicate (FR-1.5)
    for (const doc of this.documents.values()) {
      if (doc.checksum === checksum && doc.status === 'ready') {
        logger.info(`Duplicate file detected: "${file.originalname}" matches existing document ID ${doc.documentId}. Skipping re-indexing.`);
        return doc;
      }
    }

    const documentId = uuidv4();
    const docRecord: DocumentRecord = {
      documentId,
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
      logger.info(`Generated ${chunks.length} chunks for "${file.originalname}".`);

      if (chunks.length > 0) {
        // Step 3: Embed chunks
        const texts = chunks.map(c => c.text);
        const embeddings = await embeddingService.getEmbeddings(texts);

        // Step 4: Upsert into ChromaDB
        await chromaService.upsertChunks(chunks, embeddings);
      }

      docRecord.status = 'ready';
      this.documents.set(documentId, docRecord);
      await this.persistMeta();

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

  getDocuments(): DocumentRecord[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    );
  }

  getDocument(documentId: string): DocumentRecord | undefined {
    return this.documents.get(documentId);
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    // Delete vectors
    await chromaService.deleteDocumentChunks(documentId);

    // Remove from in-memory pages and records
    this.documents.delete(documentId);
    this.documentPages.delete(documentId);
    await fs.unlink(path.join(config.uploadDir, `pages_${documentId}.json`)).catch(() => {});
    await this.persistMeta();

    logger.info(`Deleted document ${documentId} ("${doc.fileName}") and its vector embeddings.`);
    return true;
  }

  async getPage(documentId: string, pageNumber: number): Promise<PageRecord | null> {
    let pages = this.documentPages.get(documentId);
    if (!pages) {
      try {
        const raw = await fs.readFile(path.join(config.uploadDir, `pages_${documentId}.json`), 'utf-8');
        pages = JSON.parse(raw);
        if (pages) this.documentPages.set(documentId, pages);
      } catch {
        return null;
      }
    }
    if (!pages) return null;
    return pages.find(p => p.pageNumber === pageNumber) || null;
  }
}

export const documentService = new DocumentService();
