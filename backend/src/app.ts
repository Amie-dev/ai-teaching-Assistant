import express from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import { chromaService } from './modules/vectorstore/chromaService.js';
import { config } from './config.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        chromaOnline: chromaService.isChromaOnline(),
        hasOpenAiKey: Boolean(config.openaiApiKey),
        hasGroqKey: Boolean(config.groqApiKey),
      },
    });
  });

  // API Routes
  app.use('/api/documents', documentRoutes);
  app.use('/api/chat', chatRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
