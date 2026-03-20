/**
 * Cliente HTTP para comunicarse con payments-service
 */

import { generateServiceToken } from "../utils/jwt";

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://localhost:4007';

interface CreatePaymentIntentPayload {
  bookingId: string;
  amount: number; // En centavos
  currency?: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING';
  userId: string;
}

interface PaymentIntentResponse {
  paymentIntent: {
    id: string;
    stripePaymentIntentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethods: string[];
  };
}

interface GetPaymentIntentPayload {
  paymentIntentId: string;
  userId: string;
}

interface CancelPaymentIntentPayload {
  paymentIntentId: string;
  userId: string;
}

export class PaymentsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PAYMENTS_SERVICE_URL;
  }

  /**
   * Crear Payment Intent para un booking
   */
  async createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<PaymentIntentResponse | null> {
    try {
      // Generar token para el usuario específico
      const serviceToken = generateServiceToken(payload.userId);
      
      const response = await fetch(`${this.baseUrl}/api/payments/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify({
          bookingId: payload.bookingId,
          amount: payload.amount,
          currency: payload.currency || 'GTQ',
          paymentType: payload.paymentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error creando Payment Intent:', error);
        return null;
      }

      return await response.json() as PaymentIntentResponse;
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión con payments-service:', error);
      return null;
    }
  }

  /**
   * Obtener detalles de un Payment Intent
   */
  async getPaymentIntent(payload: GetPaymentIntentPayload): Promise<any | null> {
    try {
      // Generar token para el usuario específico
      const serviceToken = generateServiceToken(payload.userId);
      
      const response = await fetch(
        `${this.baseUrl}/api/payments/payment-intents/${payload.paymentIntentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error obteniendo Payment Intent:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión con payments-service:', error);
      return null;
    }
  }

  /**
   * Cancelar Payment Intent
   */
  async cancelPaymentIntent(payload: CancelPaymentIntentPayload): Promise<any | null> {
    try {
      // Generar token para el usuario específico
      const serviceToken = generateServiceToken(payload.userId);
      
      const response = await fetch(
        `${this.baseUrl}/api/payments/payment-intents/${payload.paymentIntentId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error cancelando Payment Intent:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión con payments-service:', error);
      return null;
    }
  }

  /**
   * Buscar pagos de un booking
   */
  async getBookingPayments(bookingId: string, userId: string): Promise<any | null> {
    try {
      // Generar token para el usuario específico
      const serviceToken = generateServiceToken(userId);
      
      const response = await fetch(
        `${this.baseUrl}/api/payments/payments?bookingId=${bookingId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error obteniendo pagos del booking:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión con payments-service:', error);
      return null;
    }
  }
}

// Singleton instance
export const paymentsClient = new PaymentsClient();
