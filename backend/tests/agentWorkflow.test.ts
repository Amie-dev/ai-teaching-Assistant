import { describe, it, expect, beforeAll } from 'vitest';
import { conversationService } from '../src/modules/agents/conversationService.js';
import { chromaService } from '../src/modules/vectorstore/chromaService.js';
import { embeddingService } from '../src/modules/chunking/embeddingService.js';
import { ChunkRecord } from '../src/types/index.js';

describe('Module 5: Agent Routing & LangGraph Workflow (FR-5.1 to FR-5.4)', () => {
  beforeAll(async () => {
    await chromaService.initialize();

    const osChunks: ChunkRecord[] = [
      {
        chunkId: 'os_c1',
        documentId: 'os_syllabus',
        fileName: 'Operating_Systems_Ch3.pdf',
        pageNumber: 45,
        chunkIndex: 0,
        text: 'A Semaphore is a synchronization variable used to manage concurrent access to shared resources. It maintains an integer counter with wait() and signal() atomic operations.',
      },
      {
        chunkId: 'os_c2',
        documentId: 'os_syllabus',
        fileName: 'Operating_Systems_Ch3.pdf',
        pageNumber: 48,
        chunkIndex: 1,
        text: 'The Banker\'s algorithm is a deadlock avoidance algorithm. It tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources before deciding whether allocation can safely proceed.',
      },
    ];

    const embeddings = await embeddingService.getEmbeddings(osChunks.map(c => c.text));
    await chromaService.upsertChunks(osChunks, embeddings);
  });

  it('routes factual questions to factual route with citation', async () => {
    const res = await conversationService.processQuestion(
      'What is a Semaphore and what are its atomic operations?'
    );

    expect(res.route).toBe('factual');
    expect(res.message.sources?.length).toBeGreaterThan(0);
    expect(res.message.sources?.[0].fileName).toBe('Operating_Systems_Ch3.pdf');
    expect(res.message.sources?.[0].pageNumber).toBe(45);
    expect(res.message.text.length).toBeGreaterThan(0);
  });

  it('routes conceptual questions to conceptual Socratic guidance', async () => {
    const res = await conversationService.processQuestion(
      'Explain how the Banker\'s algorithm determines system safety and avoids deadlock.'
    );

    expect(res.route).toBe('conceptual');
    expect(res.message.sources?.length).toBeGreaterThan(0);
    expect(res.message.sources?.[0].pageNumber).toBe(48);
    expect(res.message.isGuidingQuestion).toBe(true);
  });

  it('provides direct answer when forceDirectAnswer is requested in Socratic mode', async () => {
    const res = await conversationService.processQuestion(
      'Why does Banker\'s algorithm check for safe states?',
      undefined,
      true // force direct answer (U9)
    );

    expect(res.route).toBe('factual');
    expect(res.message.isGuidingQuestion).toBe(false);
    expect(res.message.sources?.length).toBeGreaterThan(0);
  });

  it('flags unsupported questions that are outside course material (FR-3.3, U5)', async () => {
    const res = await conversationService.processQuestion(
      'What is the capital of France and who built the Eiffel tower?'
    );

    expect(res.route).toBe('unsupported');
    expect(res.message.sources?.length).toBe(0);
    expect(res.message.text).toContain('could not find relevant information for this question in your uploaded course materials');
  });
});
