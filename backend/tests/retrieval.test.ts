import { describe, it, expect, beforeAll } from 'vitest';
import { chromaService } from '../src/modules/vectorstore/chromaService.js';
import { retrievalService } from '../src/modules/vectorstore/retrievalService.js';
import { embeddingService } from '../src/modules/chunking/embeddingService.js';
import { ChunkRecord } from '../src/types/index.js';

describe('Module 3: Vector Store and Retrieval (FR-3.1, FR-3.2, FR-3.3)', () => {
  beforeAll(async () => {
    await chromaService.initialize();

    const sampleChunks: ChunkRecord[] = [
      {
        chunkId: 'chunk_os_1',
        documentId: 'doc_os',
        fileName: 'os_module_1.pdf',
        pageNumber: 12,
        chunkIndex: 0,
        text: 'A process is an instance of a program in execution. It contains the program counter, stack, and data section.',
      },
      {
        chunkId: 'chunk_os_2',
        documentId: 'doc_os',
        fileName: 'os_module_1.pdf',
        pageNumber: 14,
        chunkIndex: 1,
        text: 'Threads share the same memory address space and file descriptors with peer threads in the same process.',
      },
    ];

    const texts = sampleChunks.map(c => c.text);
    const embeddings = await embeddingService.getEmbeddings(texts);
    await chromaService.upsertChunks(sampleChunks, embeddings);
  });

  it('retrieves relevant chunks with source metadata', async () => {
    const res = await retrievalService.retrieveRelevantChunks('What is a process and program counter?', 2, 0.1);
    expect(res.chunks.length).toBeGreaterThan(0);
    const top = res.chunks[0];
    expect(top.fileName).toBe('os_module_1.pdf');
    expect(top.pageNumber).toBe(12);
    expect(top.similarity).toBeGreaterThan(0.1);
  });

  it('drops weak matches and returns passedThreshold=false when nothing matches', async () => {
    // Extremely high threshold to simulate irrelevant query or out-of-scope question
    const res = await retrievalService.retrieveRelevantChunks('Quantum chromodynamics quarks and gluons', 2, 0.999);
    expect(res.passedThreshold).toBe(false);
  });
});
