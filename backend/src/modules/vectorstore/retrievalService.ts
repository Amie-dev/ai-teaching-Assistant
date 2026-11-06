import { config } from '../../config.js';
import { RetrievedChunk } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { embeddingService } from '../chunking/embeddingService.js';
import { chromaService } from './chromaService.js';

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  passedThreshold: boolean;
  topScore: number;
}

export class RetrievalService {
  async retrieveRelevantChunks(
    question: string,
    topK: number = config.topK,
    threshold: number = config.relevanceThreshold,
    classroomId?: string
  ): Promise<RetrievalResult> {
    try {
      // 1. Generate embedding for user question
      const queryEmbedding = await embeddingService.getQueryEmbedding(question);

      // 2. Fetch top-K chunks from vector store (scoped to classroom if provided)
      const allRetrieved = await chromaService.querySimilarity(queryEmbedding, topK, classroomId);

      if (allRetrieved.length === 0) {
        return {
          chunks: [],
          passedThreshold: false,
          topScore: 0,
        };
      }

      const topScore = allRetrieved[0].similarity;
      // Filter out chunks below threshold
      const filtered = allRetrieved.filter(c => c.similarity >= threshold);

      const passedThreshold = filtered.length > 0;

      logger.info(
        `Retrieval for "${question}": found ${allRetrieved.length} chunks, ` +
        `top score=${topScore.toFixed(3)}, ${filtered.length} passed threshold (${threshold})`
      );

      return {
        chunks: filtered,
        passedThreshold,
        topScore,
      };
    } catch (error: any) {
      logger.error(`Retrieval failure for question "${question}": ${error.message}`);
      throw error;
    }
  }
}

export const retrievalService = new RetrievalService();
