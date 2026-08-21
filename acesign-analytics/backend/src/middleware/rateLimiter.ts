import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  maxRequests: number; // max requests per window
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const createRateLimiter = (config: RateLimitConfig) => {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }

    // Initialize or update rate limit
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - store[key].count).toString(),
      'X-RateLimit-Reset': store[key].resetTime.toString(),
    });

    next();
  };
};

// Preset configurations
export const rateLimitPresets = {
  strict: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  moderate: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
  generous: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  auth: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 auth attempts per minute
};
