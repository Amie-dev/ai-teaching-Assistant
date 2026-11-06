import { Router, Request, Response, NextFunction } from 'express';
import { conversationService } from '../modules/agents/conversationService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';

const router = Router();

/**
 * POST /api/chat - Ask a question
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, conversationId, forceDirectAnswer, classroomId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new AppError('Question field is required and must be a non-empty string.', 400);
    }

    const result = await conversationService.processQuestion(
      question.trim(),
      conversationId,
      Boolean(forceDirectAnswer),
      classroomId
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/logs - Retrieve query evaluation logs
 */
router.get('/logs', (_req: Request, res: Response) => {
  const logs = logger.getQueryLogs();
  res.json({
    success: true,
    totalLogs: logs.length,
    logs,
  });
});

/**
 * GET /api/chat/:conversationId - Get conversation messages
 */
router.get('/:conversationId', (req: Request, res: Response, next: NextFunction) => {
  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId;
  const conv = conversationService.getConversation(conversationId);
  if (!conv) {
    return next(new AppError('Conversation not found', 404));
  }

  res.json({
    success: true,
    conversation: conv,
  });
});

export default router;
