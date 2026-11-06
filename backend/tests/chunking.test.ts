import { describe, it, expect } from 'vitest';
import { splitTextIntoChunks, chunkDocumentPages } from '../src/modules/chunking/textSplitter.js';
import { PageRecord } from '../src/types/index.js';

describe('Module 2: Chunking and Metadata (FR-2.1, FR-2.2)', () => {
  it('splits long text into overlapping chunks', () => {
    const text = 'First sentence of the lecture. Second sentence about data structures. Third sentence about algorithms. Fourth sentence discussing time complexity. Fifth sentence covering space complexity.';
    const chunkSize = 80;
    const chunkOverlap = 20;

    const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(chunkSize + 10);
    }
  });

  it('keeps source file, page number, and chunk index on each chunk', () => {
    const pages: PageRecord[] = [
      { pageNumber: 1, text: 'Introduction to Operating Systems. Processes and threads.', isEmpty: false },
      { pageNumber: 2, text: 'Deadlocks occur when four Coffman conditions hold.', isEmpty: false },
    ];

    const docId = 'doc-test-123';
    const fileName = 'OS_Lecture_1.pdf';

    const chunks = chunkDocumentPages(docId, fileName, pages, { chunkSize: 50, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.documentId).toBe(docId);
      expect(chunk.fileName).toBe(fileName);
      expect(typeof chunk.pageNumber).toBe('number');
      expect(typeof chunk.chunkIndex).toBe('number');
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it('skips empty or image-only pages', () => {
    const pages: PageRecord[] = [
      { pageNumber: 1, text: 'Valid content here', isEmpty: false },
      { pageNumber: 2, text: '', isEmpty: true },
    ];

    const chunks = chunkDocumentPages('doc-1', 'test.pdf', pages);
    const p2Chunks = chunks.filter(c => c.pageNumber === 2);
    expect(p2Chunks.length).toBe(0);
  });
});
