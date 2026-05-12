import { logger } from './logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const RESOLVE_TIMEOUT_MS = 5000;

export const resolveArtistId = async (token: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const response = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
    });
    if (response.ok) {
      const data = await response.json() as any;
      return data.artist?.id ?? null;
    }
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.warn('resolveArtistId timed out', 'ARTIST_RESOLVER');
    } else {
      logger.error('Error resolving artist profile ID', 'ARTIST_RESOLVER', { error: error.message });
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
