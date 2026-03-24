import axios from 'axios';
import { logger } from '../utils/logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export interface ArtistProfile {
  id: string;
  artistName: string;
  email: string;
  category: string;
  avatar?: string;
  baseLocationLabel?: string;
  baseLocationLat?: number;
  baseLocationLng?: number;
}

export class ArtistsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
  }

  /**
   * Obtener perfil de un artista
   */
  async getArtist(artistId: string): Promise<ArtistProfile | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/artists/${artistId}`, {
        timeout: 5000,
      });

      if (response.status === 200 && response.data && response.data.artist) {
        return response.data.artist;
      }

      return null;
    } catch (error: any) {
      logger.error('Error calling artists-service', 'ARTISTS_CLIENT', {
        error: error.message,
        artistId,
        url: `${this.baseUrl}/api/artists/${artistId}`,
      });
      return null;
    }
  }
}

export const artistsClient = new ArtistsClient();
