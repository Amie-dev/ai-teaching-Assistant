import OpenAI from 'openai';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

class EmbeddingService {
  private openai: OpenAI | null = null;
  private googleAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.initClients();
  }

  private initClients(): void {
    if (config.googleApiKey && !config.googleApiKey.startsWith('your_')) {
      this.googleAI = new GoogleGenerativeAI(config.googleApiKey);
      logger.info(`Initialized Google Generative AI for embeddings (model: ${config.googleEmbeddingModel}).`);
    } else {
      this.googleAI = null;
    }

    if (config.openaiApiKey && !config.openaiApiKey.startsWith('your_')) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    } else {
      this.openai = null;
    }
  }

  private getGoogleClient(): GoogleGenerativeAI | null {
    if (!this.googleAI && config.googleApiKey && !config.googleApiKey.startsWith('your_')) {
      this.googleAI = new GoogleGenerativeAI(config.googleApiKey);
    }
    return this.googleAI;
  }

  private getOpenAIClient(): OpenAI | null {
    if (!this.openai && config.openaiApiKey && !config.openaiApiKey.startsWith('your_')) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }
    return this.openai;
  }

  getActiveProvider(): 'google' | 'openai' | 'local' {
    if (this.getGoogleClient()) return 'google';
    if (this.getOpenAIClient()) return 'openai';
    return 'local';
  }

  /**
   * Generates embeddings for an array of document chunks.
   * Priority: Google Embedding -> OpenAI Embedding -> Local Semantic Hash Embedding.
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const google = this.getGoogleClient();
    if (google) {
      try {
        return await this.getGoogleEmbeddings(google, texts, TaskType.RETRIEVAL_DOCUMENT);
      } catch (err: any) {
        logger.warn(`Google embedding failed (${err.message}). Trying secondary provider...`);
      }
    }

    const openai = this.getOpenAIClient();
    if (openai) {
      try {
        return await this.getOpenAIEmbeddings(openai, texts);
      } catch (err: any) {
        logger.warn(`OpenAI embedding failed (${err.message}). Falling back to local embeddings.`);
      }
    }

    logger.info('Using deterministic local vector embeddings for document chunks.');
    return texts.map(t => this.generateLocalFallbackEmbedding(t));
  }

  /**
   * Generates a single embedding for a user search query.
   */
  async getQueryEmbedding(text: string): Promise<number[]> {
    const google = this.getGoogleClient();
    if (google) {
      try {
        const model = google.getGenerativeModel({ model: config.googleEmbeddingModel });
        const res = await model.embedContent({
          content: { role: 'user', parts: [{ text }] },
          taskType: TaskType.RETRIEVAL_QUERY,
        });
        return res.embedding.values;
      } catch (err: any) {
        logger.warn(`Google query embedding failed (${err.message}). Trying secondary provider...`);
      }
    }

    const openai = this.getOpenAIClient();
    if (openai) {
      try {
        const results = await this.getOpenAIEmbeddings(openai, [text]);
        return results[0];
      } catch (err: any) {
        logger.warn(`OpenAI query embedding failed (${err.message}). Falling back to local embeddings.`);
      }
    }

    return this.generateLocalFallbackEmbedding(text);
  }

  /**
   * Google text-embedding-004 batch embedding with retry
   */
  private async getGoogleEmbeddings(
    google: GoogleGenerativeAI,
    texts: string[],
    taskType: TaskType,
    batchSize = 50,
    retries = 2
  ): Promise<number[][]> {
    const model = google.getGenerativeModel({ model: config.googleEmbeddingModel });
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let attempts = retries;

      while (attempts >= 0) {
        try {
          const res = await model.batchEmbedContents({
            requests: batch.map(t => ({
              content: { role: 'user', parts: [{ text: t }] },
              taskType,
            })),
          });
          allEmbeddings.push(...res.embeddings.map(e => e.values));
          break;
        } catch (err: any) {
          if (attempts > 0 && (err.status === 429 || err.message?.includes('429'))) {
            logger.warn(`Google rate limit. Retrying in 1500ms...`);
            await new Promise(r => setTimeout(r, 1500));
            attempts--;
          } else {
            throw err;
          }
        }
      }
    }

    return allEmbeddings;
  }

  /**
   * OpenAI text-embedding-3-small batch embedding with retry
   */
  private async getOpenAIEmbeddings(
    client: OpenAI,
    texts: string[],
    batchSize = 64,
    retries = 2
  ): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let attempts = retries;

      while (attempts >= 0) {
        try {
          const response = await client.embeddings.create({
            model: config.embeddingModel,
            input: batch,
          });
          allEmbeddings.push(...response.data.map(item => item.embedding));
          break;
        } catch (error: any) {
          if (attempts > 0 && (error.status === 429 || error.status >= 500)) {
            logger.warn(`OpenAI embedding rate limited (${error.status}). Retrying in 1000ms...`);
            await new Promise(r => setTimeout(r, 1000));
            attempts--;
          } else {
            throw error;
          }
        }
      }
    }

    return allEmbeddings;
  }

  /**
   * Generates a 512-dimensional normalized pseudo-vector based on weighted content hashing.
   * Filters common stopwords to prevent spurious similarity on unrelated questions.
   */
  private generateLocalFallbackEmbedding(text: string, dimensions = 512): number[] {
    const vector = new Array(dimensions).fill(0);
    const stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
      'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'of', 'it', 'its',
      'this', 'that', 'from', 'what', 'which', 'who', 'whom', 'where', 'when', 'how', 'why',
    ]);

    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 1);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isStopword = stopwords.has(word);
      const weight = isStopword ? 0.05 : 1.5;

      let hash = 5381;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 33) ^ word.charCodeAt(j);
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += weight;

      if (i < words.length - 1 && !isStopword && !stopwords.has(words[i + 1])) {
        const bigram = `${word}_${words[i + 1]}`;
        let bHash = 5381;
        for (let j = 0; j < bigram.length; j++) {
          bHash = (bHash * 33) ^ bigram.charCodeAt(j);
        }
        vector[Math.abs(bHash) % dimensions] += 2.0;
      }
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
}

export const embeddingService = new EmbeddingService();
