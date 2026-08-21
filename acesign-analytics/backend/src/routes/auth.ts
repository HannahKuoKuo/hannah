import { Router, Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, company_name, full_name } = req.body;

    if (!email || !password) {
      const error: AppError = new Error('Email and password are required');
      error.statusCode = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }

    const result = await authService.register({
      email,
      password,
      company_name,
      full_name
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error: AppError = new Error('Email and password are required');
      error.statusCode = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.userId!);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_name, full_name } = req.body;

    const updated = await authService.updateProfile(req.userId!, {
      company_name,
      full_name
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
