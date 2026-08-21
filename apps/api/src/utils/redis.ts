import { createClient } from 'redis';

let redisClient: any = null;

export async function initializeRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err: Error) => console.error('Redis error:', err));

  await redisClient.connect();

  return redisClient;
}

export function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
}

export async function cache(key: string, fn: () => Promise<any>, ttl = 3600) {
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await fn();
  await redisClient.setEx(key, ttl, JSON.stringify(result));

  return result;
}
