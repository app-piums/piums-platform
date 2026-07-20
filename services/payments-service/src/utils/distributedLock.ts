import Redis from 'ioredis';
import { logger } from './logger';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!process.env.REDIS_HOST) return null;
  try {
    _redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      // Managed Redis (DigitalOcean) exige TLS; env-gated para no afectar dev local.
      ...(process.env.REDIS_TLS === 'true' ? { tls: { rejectUnauthorized: false } } : {}),
    });
    _redis.on('error', (err) => {
      logger.warn('Redis cron-lock error', 'DISTRIBUTED_LOCK', { error: err.message });
    });
  } catch (err: any) {
    logger.warn('Redis init failed (cron lock)', 'DISTRIBUTED_LOCK', { error: err.message });
  }
  return _redis;
}

export async function withCronLock(lockName: string, ttlSeconds: number, fn: () => Promise<void>): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    logger.warn(`No Redis — running ${lockName} without distributed lock`, 'DISTRIBUTED_LOCK');
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
