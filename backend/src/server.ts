import http from 'http';
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { chromaService } from './modules/vectorstore/chromaService.js';
import { documentService } from './modules/ingestion/documentService.js';
import { seedDatabase } from './seed.js';
import { setupSocketIO } from './socket.js';

async function startServer() {
  try {
    logger.info('Initializing AI Teaching Assistant backend v2 services...');

    // Seed database with initial teacher, student, classroom and default halls
    await seedDatabase();

    // Initialize Chroma vector database
    await chromaService.initialize();

    // Initialize Document Service and load stored metadata
    await documentService.init();

    const app = createApp();
    const server = http.createServer(app);

    // Setup real-time Socket.IO gateway for discussion halls
    setupSocketIO(server);

    server.listen(config.port, () => {
      logger.info(`AI Teaching Assistant Backend v2 is running on http://localhost:${config.port}`);
      logger.info(`PostgreSQL Database: Docker Container 'ai-tutor-postgres' on localhost:5433`);
      logger.info(`Socket.IO Real-time Gateway: Active for Discussion Halls`);
      logger.info(`ChromaDB URL: ${config.chromaUrl}`);
      logger.info(`LLM Model: ${config.groqModel} via Groq`);
      logger.info(`Embedding Model: ${config.googleApiKey && !config.googleApiKey.startsWith('your_') ? config.googleEmbeddingModel + ' via Google (Default)' : 'Deterministic Local Vectors'}`);
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
