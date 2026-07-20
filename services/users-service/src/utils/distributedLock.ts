import Redis from 'ioredis';
import { logger } from './logger';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const host = process.env.REDIS_HOST || 'redis-service';
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const password = process.env.REDIS_PASSWORD;
  try {
    _redis = new Redis({ host, port, password, lazyConnect: true, enableOfflineQueue: false, ...(process.env.REDIS_TLS === 'true' ? { tls: { rejectUnauthorized: false } } : {}) });
    _redis.on('error', (err) => {
      logger.warn('Redis connection error (cron lock)', 'DISTRIBUTED_LOCK', { error: err.message });
    });
  } catch (err: any) {
    logger.warn('Redis init failed (cron lock)', 'DISTRIBUTED_LOCK', { error: err.message });
  }
  return _redis;
}

export async function withCronLock(lockName: string, ttlSeconds: number, fn: () => Promise<void>): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    logger.warn(`No Redis available — running ${lockName} without distributed lock`, 'DISTRIBUTED_LOCK');
    return fn();
  }
  const key = `cron:lock:${lockName}`;
  const acquired = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  if (!acquired) {
    logger.info(`Cron ${lockName} skipped — lock held by another pod`, 'DISTRIBUTED_LOCK');
    return;
  }
  try {
    await fn();
  } finally {
    await redis.del(key);
  }
}
