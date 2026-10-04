import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`Error processing request ${req.method} ${req.originalUrl}:`, err);

  // Multer Errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(
        res,
        400,
        'FILE_TOO_LARGE',
        'Uploaded file exceeds the maximum allowed size (15MB).'
      );
    }
    return sendError(res, 400, 'UPLOAD_ERROR', err.message);
  }

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', issues);
  }

  // File parsing / custom business errors
  if (err.message && (
    err.message.includes('Unsupported file format') ||
    err.message.includes('contains no extractable text') ||
    err.message.includes('Invalid file type')
  )) {
    return sendError(res, 400, 'INVALID_DOCUMENT', err.message);
  }

  // Not Found errors
  if (err.message && err.message.includes('not found')) {
    return sendError(res, 404, 'NOT_FOUND', err.message);
  }

  // Default Internal Server Error (Sanitized)
  const isDev = process.env.NODE_ENV !== 'production';
  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred while processing your request.',
    isDev ? { originalError: err.message } : undefined
  );
}
