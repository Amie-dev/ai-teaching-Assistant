import OpenAI from 'openai';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

class EmbeddingService {
  private openai: OpenAI | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (config.openaiApiKey && !config.openaiApiKey.startsWith('your_')) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    } else {
      this.openai = null;
    }
  }

  private getClient(): OpenAI | null {
    if (!this.openai && config.openaiApiKey && !config.openaiApiKey.startsWith('your_')) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }
    return this.openai;
  }

  /**
   * Generates embeddings for an array of text strings with batching and exponential backoff retry.
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const client = this.getClient();
    if (!client) {
      logger.info('OpenAI API key not configured or placeholder detected. Using deterministic local vector embeddings.');
      return texts.map(t => this.generateLocalFallbackEmbedding(t));
    }

    const BATCH_SIZE = 64;
    const allEmbeddings: number[][] = [];

    try {
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const embeddings = await this.embedBatchWithRetry(client, batch);
        allEmbeddings.push(...embeddings);
      }
      return allEmbeddings;
    } catch (err: any) {
      if (err.status === 401) {
        logger.warn('OpenAI API Key invalid (401). Falling back to local vector embeddings.');
        return texts.map(t => this.generateLocalFallbackEmbedding(t));
      }
      throw err;
    }
  }

  /**
   * Single text embedding for user queries.
   */
  async getQueryEmbedding(text: string): Promise<number[]> {
    const results = await this.getEmbeddings([text]);
    return results[0];
  }

  private async embedBatchWithRetry(
    client: OpenAI,
    batch: string[],
    retries = 2,
    delayMs = 1000
  ): Promise<number[][]> {
    try {
      const response = await client.embeddings.create({
        model: config.embeddingModel,
        input: batch,
      });

      return response.data.map(item => item.embedding);
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error.status >= 500)) {
        logger.warn(`OpenAI embedding rate limited (${error.status}). Retrying in ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
        return this.embedBatchWithRetry(client, batch, retries - 1, delayMs * 2);
      }
      throw error;
    }
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

      // Add bi-grams for adjacent non-stopwords
      if (i < words.length - 1 && !isStopword && !stopwords.has(words[i + 1])) {
        const bigram = `${word}_${words[i + 1]}`;
        let bHash = 5381;
        for (let j = 0; j < bigram.length; j++) {
          bHash = (bHash * 33) ^ bigram.charCodeAt(j);
        }
        vector[Math.abs(bHash) % dimensions] += 2.0;
      }
    }

    // L2 Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
}

export const embeddingService = new EmbeddingService();
