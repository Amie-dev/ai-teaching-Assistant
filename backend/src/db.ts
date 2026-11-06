import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

prisma.$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database in Docker');
  })
  .catch((err) => {
    logger.error('Failed to connect to PostgreSQL database:', err);
  });
