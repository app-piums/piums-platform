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
          currency: payload.currency || 'USD',
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
   * Crear crédito de compensación para un cliente (llamada interna)
   */
  async createCredit(payload: {
    userId: string;
    bookingId?: string;
    paidAmount: number;
    reason: string;
  }): Promise<any | null> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(`${this.baseUrl}/api/credits/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error creando crédito:', error);
        return null;
      }

      return (await response.json() as any).data ?? null;
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión al crear crédito:', error);
      return null;
    }
  }

  /**
   * Crear reembolso para un booking (llamada interna)
   */
  async createRefundInternal(payload: {
    bookingId: string;
    userId: string;
    reason: string;
    amount?: number;
  }): Promise<any | null> {
    try {
      const serviceToken = generateServiceToken(payload.userId);
      const response = await fetch(`${this.baseUrl}/api/payments/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error creando reembolso:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión al crear reembolso:', error);
      return null;
    }
  }

  /**
   * Validar un cupón para un booking (llamada a payments-service)
   */
  async validateCoupon(data: {
    code: string;
    userId: string;
    bookingId: string;
    bookingTotal: number;
    artistId?: string;
    serviceId?: string;
  }): Promise<{ valid: boolean; discount: number; couponId: string; error?: string } | null> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(`${this.baseUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error validando cupón:', error);
        return null;
      }

      const result = await response.json() as any;
      return {
        valid: result.valid,
        discount: result.discount,
        couponId: result.coupon?.id || '',
        error: result.error,
      };
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión al validar cupón:', error);
      return null;
    }
  }

  /**
   * Redimir un cupón tras crear el booking (llamada interna)
   */
  async redeemCoupon(data: {
    couponId: string;
    userId: string;
    bookingId: string;
    discountApplied: number;
  }): Promise<any | null> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(`${this.baseUrl}/api/coupons/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[PaymentsClient] Error redimiendo cupón:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentsClient] Error de conexión al redimir cupón:', error);
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
