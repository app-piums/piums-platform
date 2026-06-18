/**
 * Cliente HTTP para comunicarse con payments-service
 */

import { generateServiceToken } from "../utils/jwt";
import { logger } from '../utils/logger';

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
        signal: AbortSignal.timeout(10_000),
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
        logger.error('Error creando Payment Intent', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json() as PaymentIntentResponse;
    } catch (error) {
      logger.error('Error de conexion con payments-service', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
          signal: AbortSignal.timeout(10_000),
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error obteniendo Payment Intent', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con payments-service', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
          signal: AbortSignal.timeout(10_000),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error cancelando Payment Intent', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con payments-service', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error creando credito', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return (await response.json() as any).data ?? null;
    } catch (error) {
      logger.error('Error de conexion al crear credito', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error creando reembolso', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion al crear reembolso', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error validando cupon', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
      logger.error('Error de conexion al validar cupon', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
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
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error redimiendo cupon', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion al redimir cupon', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Crear payout para un artista tras confirmar pago (llamada interna)
   */
  async createPayoutInternal(payload: {
    artistId: string;
    bookingId?: string;
    amount: number;
    currency?: string;
    payoutType?: string;
    description?: string;
  }): Promise<any | null> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(`${this.baseUrl}/api/payouts/internal`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error creando payout', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion al crear payout', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Establecer o limpiar el hold de un payout por bookingId (llamada interna)
   * scheduledFor = ISO string para activar hold; null para liberarlo
   */
  async schedulePayoutHold(bookingId: string, scheduledFor: string | null): Promise<any | null> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(`${this.baseUrl}/api/payouts/internal/schedule`, {
        signal: AbortSignal.timeout(10_000),
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret || '',
        },
        body: JSON.stringify({ bookingId, scheduledFor }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error actualizando payout hold', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion al actualizar payout hold', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Iniciar checkout para compra de boleto de evento (ticketMode)
   */
  async initTicketCheckout(data: {
    purchaseId: string;
    userId: string;
    userEmail?: string;
    amount: number;
    currency?: string;
    returnUrl?: string;
  }): Promise<{ redirectUrl?: string; providerRef: string; orderNumber?: string } | null> {
    try {
      const serviceToken = generateServiceToken(data.userId);
      const response = await fetch(`${this.baseUrl}/api/payments/ticket-checkout`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify({
          purchaseId: data.purchaseId,
          amount: data.amount,
          currency: data.currency || 'USD',
          returnUrl: data.returnUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error iniciando ticket checkout', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json() as { redirectUrl?: string; providerRef: string; orderNumber?: string };
    } catch (error) {
      logger.error('Error de conexion al iniciar ticket checkout', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Cobrar el anticipo con la tarjeta guardada del cliente al confirmar el artista.
   * Llamado desde confirmBooking cuando paymentStatus === 'PENDING' y anticipoRequired.
   */
  async chargeDepositWithSavedCard(bookingId: string): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(
        `${this.baseUrl}/api/payments/internal/charge-deposit/${bookingId}`,
        {
          signal: AbortSignal.timeout(30_000),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error cobrando anticipo con tarjeta guardada', 'PAYMENTS_CLIENT', { bookingId, error: (error as any)?.message });
        return false;
      }

      const result = await response.json() as any;
      return result.success === true;
    } catch (error) {
      logger.error('Error de conexion al cobrar anticipo', 'PAYMENTS_CLIENT', { bookingId, error: typeof error === 'string' ? error : (error as any)?.message });
      return false;
    }
  }

  /**
   * Cobrar el saldo restante de una reserva con la tarjeta guardada del cliente.
   * Llamado por el cron job 72h antes del evento.
   * Retorna true si se cobró exitosamente o si ya estaba pagado.
   * Retorna false si no hay tarjeta guardada o si el cobro falló.
   */
  async chargeRemainingBalance(bookingId: string): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(
        `${this.baseUrl}/api/payments/internal/charge-remaining/${bookingId}`,
        {
          signal: AbortSignal.timeout(30_000),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error cobrando saldo restante', 'PAYMENTS_CLIENT', { bookingId, error: (error as any)?.message });
        return false;
      }

      const result = await response.json() as any;
      return result.success === true;
    } catch (error) {
      logger.error('Error de conexion al cobrar saldo restante', 'PAYMENTS_CLIENT', { bookingId, error: typeof error === 'string' ? error : (error as any)?.message });
      return false;
    }
  }

  /**
   * Capturar el pago pre-autorizado de una reserva (artista confirmó).
   * Llama al endpoint interno del payments-service.
   */
  async captureBooking(bookingId: string): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(
        `${this.baseUrl}/api/payments/internal/capture-booking/${bookingId}`,
        {
          signal: AbortSignal.timeout(15_000),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error capturando pago del booking', 'PAYMENTS_CLIENT', { bookingId, error: (error as any)?.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error de conexion al capturar pago', 'PAYMENTS_CLIENT', { bookingId, error: typeof error === 'string' ? error : (error as any)?.message });
      return false;
    }
  }

  /**
   * Liberar la pre-autorización de una reserva (artista rechazó o no confirmó).
   */
  async voidBooking(bookingId: string): Promise<boolean> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      const response = await fetch(
        `${this.baseUrl}/api/payments/internal/void-booking/${bookingId}`,
        {
          signal: AbortSignal.timeout(15_000),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error liberando pre-autorización del booking', 'PAYMENTS_CLIENT', { bookingId, error: (error as any)?.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error de conexion al liberar pre-autorización', 'PAYMENTS_CLIENT', { bookingId, error: typeof error === 'string' ? error : (error as any)?.message });
      return false;
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
          signal: AbortSignal.timeout(10_000),
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error obteniendo pagos del booking', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con payments-service', 'PAYMENTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }
}

// Singleton instance
export const paymentsClient = new PaymentsClient();
