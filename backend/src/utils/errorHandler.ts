import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized Express error handler (v2 spec §3.8).
 *
 * Produces uniform JSON shape: { error: { code, message } }
 *
 * Error resolution:
 *   - ZodError (validation)      → 400  VALIDATION_ERROR
 *   - SyntaxError (JSON parse)   → 400  INVALID_JSON
 *   - ApiError with statusCode   → code statusCode, code from error.code or 'EXTERNAL_API_ERROR'
 *   - Unknown                     → 500  INTERNAL_ERROR
 */
export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors,
      },
    });
    return;
  }

  // --- Malformed JSON body (express v4 / body-parser) ---
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON in request body',
      },
    });
    return;
  }

  // --- Known application errors with explicit status ---
  const apiErr = err as ApiError;
  const statusCode = apiErr.statusCode || 500;
  const code = apiErr.code || 'INTERNAL_ERROR';

  logger.error('error', {
    message: err.message,
    stack: err.stack,
    statusCode,
    code,
  });

  res.status(statusCode).json({
    error: {
      code,
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  });
}
