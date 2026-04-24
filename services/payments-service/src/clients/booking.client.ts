const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://booking-service:4008";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

const internalHeaders = {
  "Content-Type": "application/json",
  "x-internal-secret": INTERNAL_SECRET,
};

export class BookingClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_URL;
  }

  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/internal/${bookingId}`,
        { headers: internalHeaders }
      );
      if (!response.ok) {
        console.error("[BookingClient] Error obteniendo booking:", await response.text());
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[BookingClient] Error de conexión con booking-service:", error);
      return null;
    }
  }

  async markPayment(
    bookingId: string,
    amount: number,
    paymentMethod?: string,
    paymentIntentId?: string,
    paymentType?: "DEPOSIT" | "FULL_PAYMENT" | "REMAINING"
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/internal/${bookingId}/mark-payment`,
        {
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ amount, paymentMethod, paymentIntentId, paymentType }),
        }
      );
      if (!response.ok) {
        console.error("[BookingClient] Error marcando pago:", await response.text());
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[BookingClient] Error de conexión con booking-service:", error);
      return null;
    }
  }
}

export const bookingClient = new BookingClient();
