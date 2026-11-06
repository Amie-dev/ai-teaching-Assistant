import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { chromaService } from './modules/vectorstore/chromaService.js';
import { documentService } from './modules/ingestion/documentService.js';

async function startServer() {
  try {
    logger.info('Initializing AI Teaching Assistant backend services...');

    // Initialize Chroma vector database
    await chromaService.initialize();

    // Initialize Document Service and load stored metadata
    await documentService.init();

    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`AI Teaching Assistant Backend is running on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`ChromaDB URL: ${config.chromaUrl}`);
      logger.info(`LLM Model: ${config.groqModel} via Groq`);
      logger.info(`Embedding Model: ${config.embeddingModel} via OpenAI`);
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
