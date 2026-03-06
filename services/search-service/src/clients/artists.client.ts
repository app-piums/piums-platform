import { AppError } from '../middleware/errorHandler';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://localhost:4003';

export interface ArtistData {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio?: string;
  specialties: string[];
  city?: string;
  state?: string;
  country: string;
  hourlyRate?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  servicesCount?: number;
  portfolio?: any[];
  createdAt: string;
}

export const artistsClient = {
  async getArtist(artistId: string): Promise<ArtistData | null> {
    try {
      const response = await fetch(`${ARTISTS_SERVICE_URL}/api/artists/${artistId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Artists service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new AppError(`Error fetching artist: ${error.message}`, 500);
    }
  },

  async getAllArtists(page: number = 1, limit: number = 100): Promise<{ artists: ArtistData[], pagination: any }> {
    try {
      const response = await fetch(`${ARTISTS_SERVICE_URL}/api/artists?page=${page}&limit=${limit}&includeInactive=false`);

      if (!response.ok) {
        throw new Error(`Artists service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new AppError(`Error fetching artists: ${error.message}`, 500);
    }
  }
};
