import { logger } from "../utils/logger";

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://localhost:4005";

interface BookingFilters {
  artistId: string;
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface Booking {
  id: string;
  code?: string;
  clientId: string;
  artistId: string;
  serviceId: string;
  scheduledDate: string;
  durationMinutes: number;
  location?: string;
  status: string;
  totalPrice: number;
  currency: string;
  depositRequired: boolean;
  depositAmount: number;
  paymentStatus: string;
  clientNotes?: string;
  createdAt: string;
}

interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

interface BookingStatsResponse {
  total: number;
  thisMonth: number;
  pending: number;
  confirmed: number;
  completed: number;
  upcoming: Booking[];
}

export class BookingServiceClient {
  /**
   * Obtener bookings del artista con filtros
   */
  async getArtistBookings(filters: BookingFilters): Promise<BookingsResponse> {
    try {
      const params = new URLSearchParams({
        artistId: filters.artistId,
        ...(filters.status && { status: filters.status }),
        ...(filters.page && { page: filters.page.toString() }),
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(
        `${BOOKING_SERVICE_URL}/api/bookings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error("Error fetching artist bookings", "BOOKING_CLIENT", {
          status: response.status,
          statusText: response.statusText,
        });
        return { bookings: [], total: 0, page: 1, totalPages: 0 };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      logger.error("Error in getArtistBookings", "BOOKING_CLIENT", {
        error: error.message,
      });
      return { bookings: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Obtener estadísticas de bookings del artista
   */
  async getArtistStats(artistId: string): Promise<BookingStatsResponse> {
    try {
      const response = await fetch(
        `${BOOKING_SERVICE_URL}/api/stats?artistId=${artistId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error("Error fetching artist stats", "BOOKING_CLIENT", {
          status: response.status,
          statusText: response.statusText,
        });
        return {
          total: 0,
          thisMonth: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          upcoming: [],
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      logger.error("Error in getArtistStats", "BOOKING_CLIENT", {
        error: error.message,
      });
      return {
        total: 0,
        thisMonth: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        upcoming: [],
      };
    }
  }

  /**
   * Confirmar (aceptar) booking
   */
  async confirmBooking(bookingId: string, artistId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${BOOKING_SERVICE_URL}/api/bookings/${bookingId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ artistId }),
        }
      );

      if (!response.ok) {
        logger.error("Error confirming booking", "BOOKING_CLIENT", {
          bookingId,
          status: response.status,
        });
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error("Error in confirmBooking", "BOOKING_CLIENT", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Rechazar booking
   */
  async rejectBooking(
    bookingId: string,
    artistId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${BOOKING_SERVICE_URL}/api/bookings/${bookingId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ artistId, reason }),
        }
      );

      if (!response.ok) {
        logger.error("Error rejecting booking", "BOOKING_CLIENT", {
          bookingId,
          status: response.status,
        });
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error("Error in rejectBooking", "BOOKING_CLIENT", {
        error: error.message,
      });
      return false;
    }
  }
}

export const bookingServiceClient = new BookingServiceClient();
