/**
 * Cliente HTTP para comunicarse con booking-service
 */

import jwt from "jsonwebtoken";

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:4005';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const generateServiceToken = (userId: string): string => {
  return jwt.sign({ userId, email: 'service@internal', isService: true }, JWT_SECRET, { expiresIn: '5m' });
};

export class BookingClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_URL;
  }

  /**
   * Obtener detalles de un booking
   */
  async getBooking(bookingId: string, userId: string): Promise<any | null> {
    try {
      const serviceToken = generateServiceToken(userId);
      
      const response = await fetch(`${this.baseUrl}/api/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[BookingClient] Error obteniendo booking:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[BookingClient] Error de conexión con booking-service:', error);
      return null;
    }
  }

  /**
   * Actualizar booking con reviewId después de crear una reseña
   */
  async updateBookingWithReview(bookingId: string, reviewId: string, userId: string): Promise<any | null> {
    try {
      const serviceToken = generateServiceToken(userId);
      
      const response = await fetch(`${this.baseUrl}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[BookingClient] Error actualizando booking:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[BookingClient] Error de conexión con booking-service:', error);
      return null;
    }
  }
}

export const bookingClient = new BookingClient();
