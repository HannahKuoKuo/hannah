import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('Request error', {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
    stack: error.stack
  });

  res.status(statusCode).json({
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};
