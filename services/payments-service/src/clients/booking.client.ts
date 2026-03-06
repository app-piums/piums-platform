/**
 * Cliente HTTP para comunicarse con booking-service
 */

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://localhost:4005";
const SERVICE_TOKEN = process.env.JWT_SECRET;

export class BookingClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || "";
  }

  /**
   * Obtener información de una reserva
   */
  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/${bookingId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "[BookingClient] Error obteniendo booking:",
          await response.text()
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[BookingClient] Error de conexión con booking-service:",
        error
      );
      return null;
    }
  }

  /**
   * Marcar pago en una reserva
   */
  async markPayment(
    bookingId: string,
    amount: number,
    paymentMethod?: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/${bookingId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.serviceToken}`,
          },
          body: JSON.stringify({ amount, paymentMethod }),
        }
      );

      if (!response.ok) {
        console.error(
          "[BookingClient] Error marcando pago:",
          await response.text()
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[BookingClient] Error de conexión con booking-service:",
        error
      );
      return null;
    }
  }
}

export const bookingClient = new BookingClient();
