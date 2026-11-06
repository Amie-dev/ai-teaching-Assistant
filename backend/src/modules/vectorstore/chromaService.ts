import { ChromaClient, Collection } from 'chromadb';
import { config } from '../../config.js';
import { ChunkRecord, RetrievedChunk } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

interface MemoryStoreItem {
  id: string;
  documentId: string;
  classroomId?: string;
  fileName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding: number[];
}

class ChromaService {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private isConnectedToChroma = false;

  // In-memory fallback index for robustness when ChromaDB container is offline
  private memoryChunks: Map<string, MemoryStoreItem> = new Map();
  private fallbackStorePath = 'uploads/vector_store.json';

  async initialize(): Promise<void> {
    try {
      let host = 'localhost';
      let port = 8001;
      let ssl = false;

      try {
        const parsed = new URL(config.chromaUrl);
        host = parsed.hostname;
        port = parsed.port ? parseInt(parsed.port, 10) : 8000;
        ssl = parsed.protocol === 'https:';
      } catch {
        // Fallback to default host/port
      }

      this.client = new ChromaClient({ host, port, ssl });

      // In our architecture, vectors are computed beforehand via embeddingService
      const dummyEmbeddingFunction = {
        generate: async (_texts: string[]) => [],
      };

      this.collection = await this.client.getOrCreateCollection({
        name: config.chromaCollectionName,
        metadata: { 'hnsw:space': 'cosine' },
        embeddingFunction: dummyEmbeddingFunction as any,
      });

      this.isConnectedToChroma = true;
      logger.info(`Connected to ChromaDB at ${config.chromaUrl}, collection: ${config.chromaCollectionName}`);
    } catch (error: any) {
      this.isConnectedToChroma = false;
      logger.info(`ChromaDB server not detected at ${config.chromaUrl}. Activated in-memory vector store.`);
      await this.loadFallbackStore();
    }
  }

  private async loadFallbackStore(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.fallbackStorePath, 'utf-8').catch(() => null);
      if (data) {
        const items = JSON.parse(data) as MemoryStoreItem[];
        for (const it of items) {
          this.memoryChunks.set(it.id, it);
        }
        logger.info(`Loaded ${this.memoryChunks.size} vectors from local vector cache.`);
      }
    } catch (err: any) {
      logger.warn(`Could not load local vector cache: ${err.message}`);
    }
  }

  private async persistFallbackStore(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const items = Array.from(this.memoryChunks.values());
      await fs.writeFile(this.fallbackStorePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err: any) {
      logger.warn(`Could not persist local vector cache: ${err.message}`);
    }
  }

  isChromaOnline(): boolean {
    return this.isConnectedToChroma;
  }

  /**
   * Adds or updates chunk vectors in ChromaDB (or fallback store).
   */
  async upsertChunks(chunks: ChunkRecord[], embeddings: number[][], classroomId?: string): Promise<void> {
    if (chunks.length === 0) return;

    if (this.isConnectedToChroma && this.collection) {
      try {
        const ids = chunks.map(c => c.chunkId);
        const documents = chunks.map(c => c.text);
        const metadatas = chunks.map(c => ({
          documentId: c.documentId,
          classroomId: c.classroomId || classroomId || 'default',
          fileName: c.fileName,
          pageNumber: c.pageNumber,
          chunkIndex: c.chunkIndex,
        }));

        await this.collection.upsert({
          ids,
          embeddings,
          documents,
          metadatas,
        });

        logger.info(`Upserted ${chunks.length} chunks into ChromaDB`);
        return;
      } catch (err: any) {
        logger.error(`ChromaDB upsert failed, falling back to memory store: ${err.message}`);
        this.isConnectedToChroma = false;
      }
    }

    // In-memory fallback
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      this.memoryChunks.set(c.chunkId, {
        id: c.chunkId,
        documentId: c.documentId,
        classroomId: c.classroomId || classroomId,
        fileName: c.fileName,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        text: c.text,
        embedding: embeddings[i],
      });
    }
    await this.persistFallbackStore();
    logger.info(`Stored ${chunks.length} chunks in memory vector store`);
  }

  /**
   * Removes all chunks belonging to a documentId.
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    if (this.isConnectedToChroma && this.collection) {
      try {
        await this.collection.delete({
          where: { documentId: documentId },
        });
        logger.info(`Deleted chunks for document ${documentId} from ChromaDB`);
      } catch (err: any) {
        logger.error(`Error deleting document from ChromaDB: ${err.message}`);
      }
    }

    // Remove from in-memory store
    for (const [id, item] of this.memoryChunks.entries()) {
      if (item.documentId === documentId) {
        this.memoryChunks.delete(id);
      }
    }
  }

  /**
   * Queries top-k most similar chunks for a given query vector.
   */
  async querySimilarity(
    queryEmbedding: number[],
    topK: number = config.topK,
    classroomId?: string
  ): Promise<RetrievedChunk[]> {
    if (this.isConnectedToChroma && this.collection) {
      try {
        const queryParams: any = {
          queryEmbeddings: [queryEmbedding],
          nResults: topK,
        };
        if (!classroomId) {
          return [];
        }
        queryParams.where = { classroomId: { $eq: classroomId } };

        const results = await this.collection.query(queryParams);

        const retrieved: RetrievedChunk[] = [];
        const ids = results.ids[0] || [];
        const docs = results.documents[0] || [];
        const metadatas = results.metadatas[0] || [];
        const distances = results.distances ? results.distances[0] : [];

        for (let i = 0; i < ids.length; i++) {
          const meta = metadatas[i] as any;
          const distance = distances[i] ?? 0.5;
          const similarity = Math.max(0, Math.min(1, 1 - distance));

          retrieved.push({
            chunkId: ids[i],
            documentId: meta.documentId,
            classroomId: meta.classroomId,
            fileName: meta.fileName,
            pageNumber: Number(meta.pageNumber),
            chunkIndex: Number(meta.chunkIndex),
            text: docs[i] || '',
            similarity,
            distance,
          });
        }

        return retrieved;
      } catch (err: any) {
        logger.error(`Chroma query error: ${err.message}. Using memory fallback.`);
      }
    }

    // Fallback: cosine similarity against memory items
    return this.queryMemoryStore(queryEmbedding, topK, classroomId);
  }

  private queryMemoryStore(queryVector: number[], topK: number, classroomId?: string): RetrievedChunk[] {
    const scored: Array<{ item: MemoryStoreItem; similarity: number }> = [];

    for (const item of this.memoryChunks.values()) {
      if (!classroomId || item.classroomId !== classroomId) {
        continue;
      }
      const sim = this.cosineSimilarity(queryVector, item.embedding);
      scored.push({ item, similarity: sim });
    }

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK).map(({ item, similarity }) => ({
      chunkId: item.id,
      documentId: item.documentId,
      classroomId: item.classroomId,
      fileName: item.fileName,
      pageNumber: item.pageNumber,
      chunkIndex: item.chunkIndex,
      text: item.text,
      similarity,
      distance: 1 - similarity,
    }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

export const chromaService = new ChromaService();
