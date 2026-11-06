import { PDFParse } from 'pdf-parse';
import { PageRecord } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export interface ParsedPdfResult {
  pages: PageRecord[];
  totalPageCount: number;
  emptyPageCount: number;
  warnings: string[];
}

export async function parsePdfBuffer(buffer: Buffer, fileName: string): Promise<ParsedPdfResult> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    
    const pages: PageRecord[] = [];
    const warnings: string[] = [];
    let emptyPageCount = 0;

    for (const page of result.pages) {
      const text = (page.text || '').trim();
      const isEmpty = text.length < 15; // Image-only or empty page threshold
      
      if (isEmpty) {
        emptyPageCount++;
        warnings.push(`Page ${page.num} contains little or no extractable text. It may be scanned or image-only.`);
      }

      pages.push({
        pageNumber: page.num,
        text: text,
        isEmpty: isEmpty,
      });
    }

    if (emptyPageCount === result.total && result.total > 0) {
      warnings.push(`Warning: All ${result.total} pages in "${fileName}" appear to be scanned images or empty. Text-based RAG requires selectable text.`);
    }

    logger.info(`Parsed PDF "${fileName}": ${result.total} pages, ${emptyPageCount} empty/scanned pages.`);

    return {
      pages,
      totalPageCount: result.total || pages.length,
      emptyPageCount,
      warnings,
    };
  } catch (error: any) {
    logger.error(`Failed to parse PDF "${fileName}": ${error.message}`);
    throw new Error(`PDF Parsing failed: ${error.message}`);
  }
}
