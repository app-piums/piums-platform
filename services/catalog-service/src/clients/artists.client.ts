import { logger } from '../utils/logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export class ArtistsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
  }

  private getInternalSecret(): string {
    return process.env.INTERNAL_SERVICE_SECRET || '';
  }

  // artistId here is always the auth user ID (from booking/posting/application)
  async getArtist(authId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/artists/internal/by-auth/${authId}`, {
        headers: { 'x-internal-secret': this.getInternalSecret() },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      // Normalize fields: internal endpoint returns { id, authId, artistName, avatar, nombre?, email?, category? }
      // Provide aliases expected by posting.service.ts
      if (!data || data.error) return null;
      return {
        ...data,
        displayName: data.artistName || data.nombre || null,
        nombre: data.nombre || data.artistName || null,
        profileImageUrl: data.avatar || null,
        imagenPerfil: data.avatar || null,
        categoria: data.category || null,
      };
    } catch (error: any) {
      logger.error('Error calling artists-service', 'ARTISTS_CLIENT', { error: error.message, authId });
      return null;
    }
  }
}

export const artistsClient = new ArtistsClient();
