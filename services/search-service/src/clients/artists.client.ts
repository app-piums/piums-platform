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
  blackouts?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    type: 'VACATION' | 'WORKING_ABROAD';
    destinationCountry?: string | null;
  }>;
  geoCountry?: string | null; // Real-time GPS country code
}

export const artistsClient = {
  async getArtist(artistId: string): Promise<ArtistData | null> {
    try {
      const response = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Artists service error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      // API returns { artist: {...} } with `nombre` instead of `name`
      const raw: any = data.artist || data;
      return {
        ...raw,
        name: raw.name ?? raw.nombre,
        minHourlyRate: raw.minHourlyRate ?? (raw.hourlyRateMin != null ? raw.hourlyRateMin / 100 : undefined),
        maxHourlyRate: raw.maxHourlyRate ?? (raw.hourlyRateMax != null ? raw.hourlyRateMax / 100 : undefined),
      } as ArtistData;
    } catch (error: any) {
      throw new AppError(`Error fetching artist: ${error.message}`, 500);
    }
  },

  async getAllArtists(page: number = 1, limit: number = 100): Promise<{ artists: ArtistData[], pagination: any }> {
    try {
      const response = await fetch(`${ARTISTS_SERVICE_URL}/artists/search?page=${page}&limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Artists service error: ${response.statusText}`);
      }

      return (await response.json()) as { artists: ArtistData[], pagination: any };
    } catch (error: any) {
      throw new AppError(`Error fetching artists: ${error.message}`, 500);
    }
  }
};
