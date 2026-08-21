import { Request, Response, NextFunction } from 'express';
import { initializeLogger } from '../utils/logger';

const logger = initializeLogger();

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error'
  });
}
