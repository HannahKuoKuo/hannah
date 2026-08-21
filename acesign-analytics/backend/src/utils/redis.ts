import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient) return redisClient;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    logger.info('Redis connection successful');

    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function getRedis(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

export async function cache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const redis = getRedis();

  try {
    // 尝试从缓存获取
    const cached = await redis.get(key);
    if (cached) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(cached) as T;
    }

    // 执行函数获取数据
    logger.debug(`Cache miss: ${key}, executing function...`);
    const result = await fn();

    // 存储到缓存
    await redis.setEx(key, ttl, JSON.stringify(result));

    return result;
  } catch (error) {
    logger.warn(`Cache operation failed for ${key}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    // 如果缓存失败，直接执行函数
    return fn();
  }
}

export async function invalidateCache(pattern: string): Promise<number> {
  const redis = getRedis();

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.info(`Invalidated ${keys.length} cache keys matching ${pattern}`);
      return keys.length;
    }
    return 0;
  } catch (error) {
    logger.error(`Failed to invalidate cache pattern ${pattern}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
