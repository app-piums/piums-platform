import { logger } from './logger';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';
const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const RESOLVE_TIMEOUT_MS = 4000;

interface ParticipantInfo {
  nombre: string;
  email: string;
  avatar?: string;
}

const cache = new Map<string, ParticipantInfo | null>();

const fetchWithTimeout = (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
};

const resolveFromUsersService = async (authId: string): Promise<ParticipantInfo | null> => {
  try {
    const response = await fetchWithTimeout(
      `${USERS_SERVICE_URL}/api/users/internal/by-auth/${authId}`,
      { headers: { 'x-internal-secret': INTERNAL_SECRET } }
    );
    if (!response.ok) return null;
    const data = await response.json() as any;
    return {
      nombre: data.nombre || data.fullName || data.email || 'Usuario',
      email: data.email || '',
      avatar: data.avatar,
    };
  } catch {
    return null;
  }
};

const resolveAvatarByAuthId = async (authId: string): Promise<string | null> => {
  try {
    const response = await fetchWithTimeout(
      `${ARTISTS_SERVICE_URL}/artists/internal/by-auth/${authId}`,
      { headers: { 'x-internal-secret': INTERNAL_SECRET } }
    );
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.avatar ?? null;
  } catch {
    return null;
  }
};

const resolveFromArtistsService = async (artistId: string): Promise<ParticipantInfo | null> => {
  try {
    const response = await fetchWithTimeout(
      `${ARTISTS_SERVICE_URL}/artists/internal/by-ids`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SECRET,
        },
        body: JSON.stringify({ ids: [artistId] }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json() as any;
    const artist = data.artists?.[0];
    if (!artist) return null;
    // If artist.avatar is null, fall back to users-service avatar via authId (Google OAuth photo)
    let avatar: string | undefined = artist.avatar ?? undefined;
    if (!avatar && artist.authId) {
      const userInfo = await resolveFromUsersService(artist.authId);
      avatar = userInfo?.avatar ?? undefined;
    }
    return {
      nombre: artist.nombre || 'Artista',
      email: '',
      avatar,
    };
  } catch {
    return null;
  }
};

export const resolveUserInfo = async (participantId: string): Promise<ParticipantInfo | null> => {
  if (cache.has(participantId)) return cache.get(participantId)!;

  // Try users service first (works for client auth IDs)
  const userInfo = await resolveFromUsersService(participantId);
  if (userInfo) {
    // If no avatar, check artists-service by authId (artist may have uploaded photo there)
    if (!userInfo.avatar) {
      userInfo.avatar = (await resolveAvatarByAuthId(participantId)) ?? undefined;
    }
    cache.set(participantId, userInfo);
    return userInfo;
  }

  // Fallback: try artists service (works for artist profile IDs)
  const artistInfo = await resolveFromArtistsService(participantId);
  if (artistInfo) {
    cache.set(participantId, artistInfo);
    return artistInfo;
  }

  logger.error('Could not resolve participant info', 'USER_RESOLVER', { participantId });
  cache.set(participantId, null);
  return null;
};
