import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: any;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      const error: AppError = new Error('Missing authorization token');
      error.statusCode = 401;
      error.code = 'MISSING_TOKEN';
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    if (!decoded.userId) {
      const error: AppError = new Error('Invalid token payload');
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    req.userId = decoded.userId;
    req.user = decoded;

    logger.debug('Token verified', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.warn('Token verification failed', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });

    if (error instanceof jwt.JsonWebTokenError) {
      const err: AppError = new Error('Invalid token');
      err.statusCode = 401;
      err.code = 'INVALID_TOKEN';
      return next(err);
    }

    if (error instanceof jwt.TokenExpiredError) {
      const err: AppError = new Error('Token expired');
      err.statusCode = 401;
      err.code = 'TOKEN_EXPIRED';
      return next(err);
    }

    next(error);
  }
};
