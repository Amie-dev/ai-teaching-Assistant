import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Storage paths
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  
  // Model settings
  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'google') as 'google' | 'openai' | 'local',
  googleApiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
  googleEmbeddingModel: process.env.GOOGLE_EMBEDDING_MODEL || 'gemini-embedding-2',

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  
  // Chroma settings
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8001',
  chromaCollectionName: process.env.CHROMA_COLLECTION || 'course_materials',
  
  // RAG chunking parameters
  chunkSize: parseInt(process.env.CHUNK_SIZE || '600', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
  
  // Retrieval settings
  topK: parseInt(process.env.TOP_K || '4', 10),
  // Cosine distance threshold (in Chroma, cosine distance = 1 - cosine similarity; lower is closer. Or similarity 0-1)
  relevanceThreshold: parseFloat(process.env.RELEVANCE_THRESHOLD || '0.55'), // Minimum similarity or max distance
  
  // Socratic agent parameters
  socraticTurnLimit: parseInt(process.env.SOCRATIC_TURN_LIMIT || '3', 10),
  defaultRoute: (process.env.DEFAULT_ROUTE || 'factual') as 'factual' | 'conceptual',
  
  // System timeouts
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
};
