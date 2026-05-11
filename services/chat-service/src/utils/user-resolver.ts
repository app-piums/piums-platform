import { logger } from './logger';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

interface UserInfo {
  nombre: string;
  email: string;
  avatar?: string;
}

// Simple in-memory cache to avoid repeated lookups per request cycle
const cache = new Map<string, UserInfo | null>();

export const resolveUserInfo = async (authId: string): Promise<UserInfo | null> => {
  if (cache.has(authId)) return cache.get(authId)!;

  try {
    const response = await fetch(`${USERS_SERVICE_URL}/users/internal/by-auth/${authId}`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET },
    });

    if (response.ok) {
      const data = await response.json() as any;
      const info: UserInfo = {
        nombre: data.nombre || data.fullName || data.email || 'Cliente',
        email: data.email || '',
        avatar: data.avatar,
      };
      cache.set(authId, info);
      return info;
    }

    cache.set(authId, null);
    return null;
  } catch (error: any) {
    logger.error('Error resolving user info', 'USER_RESOLVER', { error: error.message, authId });
    return null;
  }
};
