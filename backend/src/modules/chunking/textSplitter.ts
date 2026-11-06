import { ChunkRecord, PageRecord } from '../../types/index.js';
import { config } from '../../config.js';

export interface SplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Splits page text into overlapping chunks while preserving sentence/paragraph boundaries where possible.
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = config.chunkSize,
  chunkOverlap: number = config.chunkOverlap
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanText.length) {
    let end = start + chunkSize;

    if (end >= cleanText.length) {
      chunks.push(cleanText.slice(start).trim());
      break;
    }

    // Attempt to break at a paragraph or sentence boundary
    let breakPoint = -1;
    const windowSlice = cleanText.slice(start, end);

    // Look for paragraph break
    const lastDoubleNewline = windowSlice.lastIndexOf('\n\n');
    if (lastDoubleNewline > chunkSize * 0.4) {
      breakPoint = start + lastDoubleNewline + 2;
    } else {
      // Look for sentence end (.!?)
      const sentenceMatch = windowSlice.match(/[.!?]\s+(?=[A-Z0-9])/g);
      if (sentenceMatch) {
        const lastSentenceIndex = windowSlice.search(/[.!?]\s+(?=[A-Z0-9])[^.!?]*$/);
        if (lastSentenceIndex > chunkSize * 0.4) {
          breakPoint = start + lastSentenceIndex + 2;
        }
      }
    }

    // If no clean boundary found, break at whitespace
    if (breakPoint === -1) {
      const lastSpace = windowSlice.lastIndexOf(' ');
      if (lastSpace > chunkSize * 0.3) {
        breakPoint = start + lastSpace + 1;
      } else {
        breakPoint = end;
      }
    }

    const chunkContent = cleanText.slice(start, breakPoint).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    // Advance start position with overlap
    start = Math.max(breakPoint - chunkOverlap, start + 1);
  }

  return chunks;
}

/**
 * Splits document pages into ChunkRecords carrying complete source and page metadata.
 */
export function chunkDocumentPages(
  documentId: string,
  fileName: string,
  pages: PageRecord[],
  options?: SplitterOptions
): ChunkRecord[] {
  const chunkSize = options?.chunkSize || config.chunkSize;
  const chunkOverlap = options?.chunkOverlap || config.chunkOverlap;
  const chunkRecords: ChunkRecord[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    if (page.isEmpty || !page.text) {
      continue;
    }

    const textChunks = splitTextIntoChunks(page.text, chunkSize, chunkOverlap);

    for (const text of textChunks) {
      chunkRecords.push({
        chunkId: `${documentId}_p${page.pageNumber}_c${globalChunkIndex}`,
        documentId,
        fileName,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex,
        text,
      });
      globalChunkIndex++;
    }
  }

  return chunkRecords;
}
