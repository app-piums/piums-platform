import { logger } from './logger';

const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://app.tilopay.com/api/v1';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '';
const TILOPAY_API_SECRET = process.env.TILOPAY_API_SECRET || '';

// TTL 23h — Tilopay tokens expire in 24h; refresh 1h early
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cache: CachedToken | null = null;

export async function getTilopayToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.token;
  }

  if (!TILOPAY_API_USER || !TILOPAY_API_SECRET) {
    throw new Error('Tilopay credentials not configured (TILOPAY_API_USER / TILOPAY_API_SECRET)');
  }

  // POST /login with { apiuser, password } — returns { access_token }
  const res = await fetch(`${TILOPAY_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiuser: TILOPAY_API_USER, password: TILOPAY_API_SECRET }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('Tilopay token request failed', 'TILOPAY_TOKEN_CACHE', { status: res.status, body });
    throw new Error(`Tilopay authentication failed: HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  const token: string = data.access_token || data.token;

  if (!token) {
    throw new Error('Tilopay token missing in response');
  }

  cache = { token, expiresAt: Date.now() + TOKEN_TTL_MS };
  logger.info('Tilopay token refreshed', 'TILOPAY_TOKEN_CACHE');
  return token;
}

export function clearTilopayTokenCache(): void {
  cache = null;
}
