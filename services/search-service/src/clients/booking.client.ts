import { logger } from '../utils/logger';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:4008';

export interface ArtistBookingStats {
  total: number;
  completed: number;
  cancelled: number;
  rating?: number;
}

export class BookingClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_URL;
  }

  /**
   * Obtener estadísticas de reservas para un artista
   */
  async getArtistStats(artistId: string): Promise<ArtistBookingStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bookings/stats?artistId=${artistId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json() as ArtistBookingStats;
      }

      return null;
    } catch (error: any) {
      logger.error(`Error fetching booking stats for artist ${artistId}`, error);
      return null;
    }
  }
}

export const bookingClient = new BookingClient();
