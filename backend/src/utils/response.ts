import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {})
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}
