import axios from 'axios';
import { logger } from '../utils/logger';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:4008';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

const internalHeaders = () => INTERNAL_SECRET ? { 'x-internal-secret': INTERNAL_SECRET } : {};

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  bookingsThisMonth?: number;
  revenueThisMonth?: number;
  bookingsByMonth?: Array<{ month: string; count: number }>;
  revenueByMonth?: Array<{ month: string; amount: number }>;
  topArtists?: Array<{ artistId: string; bookings: number; revenue: number }>;
}

export class BookingClient {
  /**
   * Obtiene estadísticas generales de reservas
   */
  async getStats(months: number = 6): Promise<BookingStats> {
    try {
      const response = await axios.get(`${BOOKING_SERVICE_URL}/api/bookings/stats/admin?months=${months}`, {
        headers: internalHeaders(),
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching booking stats', 'BOOKING_CLIENT', error.message);
      // Fallback a ceros si el servicio falla
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
      };
    }
  }

  /**
   * Obtiene la lista completa de reservas para el admin
   */
  async listBookings(params: any = {}) {
    try {
      const response = await axios.get(`${BOOKING_SERVICE_URL}/api/bookings/admin/search`, {
        params,
        headers: internalHeaders(),
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error listing bookings', 'BOOKING_CLIENT', error.message);
      return { bookings: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Obtiene el detalle completo de una reserva por ID (uso admin, sin verificación de permisos)
   */
  async getBookingDetail(bookingId: string) {
    try {
      const response = await axios.get(`${BOOKING_SERVICE_URL}/api/bookings/${bookingId}`, {
        headers: internalHeaders(),
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching booking detail', 'BOOKING_CLIENT', error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un usuario específico
   */
  async getUserStats(userId: string) {
    try {
      const response = await axios.get(`${BOOKING_SERVICE_URL}/api/bookings/users/${userId}/stats`, {
        timeout: 2000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching user booking stats', 'BOOKING_CLIENT', error.message);
      return { total: 0 };
    }
  }

  /**
   * Obtiene estadísticas para una lista de artistas
   */
  async getBatchStats(artistIds: string[]) {
    try {
      if (artistIds.length === 0) return {};
      const response = await axios.post(`${BOOKING_SERVICE_URL}/api/bookings/admin/batch-stats`, {
        artistIds,
      }, { headers: internalHeaders(), timeout: 3000 });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching batch booking stats', 'BOOKING_CLIENT', error.message);
      return {};
    }
  }
}

export const bookingClient = new BookingClient();
