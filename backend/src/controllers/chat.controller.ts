import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chatService';
import { ChatRequestSchema } from '../schemas';
import logger from '../utils/logger';

export const chatController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ChatRequestSchema.parse(req.body);

    logger.info('chat_request_received', {
      messageCount: validated.messages.length,
      stream: validated.stream ?? false,
    });

    const { response, processingTime } = await chatService.processMessage(validated);

    logger.info('chat_response_sent', { processingTime });

    res.json({
      content: response.content,
      usage: response.usage,
      processingTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }

    next(error);
  }
};
