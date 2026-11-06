import express from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { classroomRouter } from './routes/classroomRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import { chromaService } from './modules/vectorstore/chromaService.js';
import { config } from './config.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      services: {
        chromaOnline: chromaService.isChromaOnline(),
        hasGoogleKey: Boolean(config.googleApiKey && !config.googleApiKey.startsWith('your_')),
        hasOpenAiKey: Boolean(config.openaiApiKey && !config.openaiApiKey.startsWith('your_')),
        hasGroqKey: Boolean(config.groqApiKey && !config.groqApiKey.startsWith('your_')),
      },
    });
  });

  // PRD v2 API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/classrooms', classroomRouter);
  app.use('/api/documents', documentRoutes);
  app.use('/api/chat', chatRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
