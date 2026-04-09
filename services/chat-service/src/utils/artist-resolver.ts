import { logger } from './logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export const resolveArtistId = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      return data.artist?.id; // Returns the Artist Profile UUID
    }
    return null;
  } catch (error: any) {
    logger.error('Error resolving artist profile ID', 'ARTIST_RESOLVER', { error: error.message });
    return null;
  }
};
