import { logger } from './logger';

interface CacheEntry { active: boolean; expiresAt: number; }
const jtiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of jtiCache) {
    if (entry.expiresAt <= now) jtiCache.delete(key);
  }
}, 60_000);

export async function isJtiActive(jti: string): Promise<boolean> {
  const now = Date.now();
  const cached = jtiCache.get(jti);
  if (cached && cached.expiresAt > now) return cached.active;

  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
  const secret = process.env.INTERNAL_SERVICE_SECRET || '';
  try {
    const res = await fetch(`${authServiceUrl}/auth/internal/sessions/${jti}`, {
      headers: { 'x-internal-secret': secret },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      logger.warn('JTI verify: auth-service responded non-OK, failing open', 'JTI_VERIFIER', { status: res.status });
      return true; // fail-open: if auth-service is down, allow request
    }
    const data = await res.json() as { active: boolean };
    jtiCache.set(jti, { active: data.active, expiresAt: now + CACHE_TTL_MS });
    return data.active;
  } catch (err: any) {
    logger.warn('JTI verify: could not reach auth-service, failing open', 'JTI_VERIFIER', { error: err.message });
    return true; // fail-open
  }
}
