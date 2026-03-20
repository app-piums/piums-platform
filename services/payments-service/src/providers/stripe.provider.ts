/**
 * Stripe Provider - Integración con Stripe API
 */

import Stripe from "stripe";
import { logger } from "../utils/logger";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

if (!STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY no configurada", "STRIPE_PROVIDER");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export class StripeProvider {
  /**
   * Crear Payment Intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
    paymentMethodTypes?: string[];
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        description: params.description,
        metadata: params.metadata || {},
        payment_method_types: params.paymentMethodTypes || ["card"],
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      logger.info("Payment Intent creado", "STRIPE_PROVIDER", {
        paymentIntentId: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error("Error creando Payment Intent", "STRIPE_PROVIDER", {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Recuperar Payment Intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      logger.error("Error recuperando Payment Intent", "STRIPE_PROVIDER", {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Confirmar Payment Intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        params
      );

      logger.info("Payment Intent confirmado", "STRIPE_PROVIDER", {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error("Error confirmando Payment Intent", "STRIPE_PROVIDER", {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cancelar Payment Intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      logger.info("Payment Intent cancelado", "STRIPE_PROVIDER", {
        paymentIntentId,
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error("Error cancelando Payment Intent", "STRIPE_PROVIDER", {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Crear Refund
   */
  async createRefund(params: {
    paymentIntentId?: string;
    chargeId?: string;
    amount?: number;
    reason?: Stripe.RefundCreateParams.Reason;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        ...(params.paymentIntentId && { payment_intent: params.paymentIntentId }),
        ...(params.chargeId && { charge: params.chargeId }),
        ...(params.amount && { amount: params.amount }),
        ...(params.reason && { reason: params.reason }),
        metadata: params.metadata || {},
      };

      const refund = await stripe.refunds.create(refundParams);

      logger.info("Refund creado", "STRIPE_PROVIDER", {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      });

      return refund;
    } catch (error: any) {
      logger.error("Error creando refund", "STRIPE_PROVIDER", {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Recuperar Refund
   */
  async retrieveRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      return await stripe.refunds.retrieve(refundId);
    } catch (error: any) {
      logger.error("Error recuperando refund", "STRIPE_PROVIDER", {
        refundId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Guardar Payment Method
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      logger.info("Payment Method adjuntado", "STRIPE_PROVIDER", {
        paymentMethodId,
        customerId,
      });

      return paymentMethod;
    } catch (error: any) {
      logger.error("Error adjuntando Payment Method", "STRIPE_PROVIDER", {
        paymentMethodId,
        customerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Recuperar Payment Method
   */
  async retrievePaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error: any) {
      logger.error("Error recuperando Payment Method", "STRIPE_PROVIDER", {
        paymentMethodId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detach Payment Method (desconectar de customer)
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      logger.info("Payment Method detached", "STRIPE_PROVIDER", {
        paymentMethodId,
      });

      return paymentMethod;
    } catch (error: any) {
      logger.error("Error detaching Payment Method", "STRIPE_PROVIDER", {
        paymentMethodId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verificar Webhook Signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_WEBHOOK_SECRET
      );

      logger.info("Webhook signature verificada", "STRIPE_PROVIDER", {
        eventType: event.type,
        eventId: event.id,
      });

      return event;
    } catch (error: any) {
      logger.error("Error verificando webhook signature", "STRIPE_PROVIDER", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Crear Cliente en Stripe
   */
  async createCustomer(params: {
    email?: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      });

      logger.info("Cliente creado en Stripe", "STRIPE_PROVIDER", {
        customerId: customer.id,
        email: params.email,
      });

      return customer;
    } catch (error: any) {
      logger.error("Error creando cliente", "STRIPE_PROVIDER", {
        error: error.message,
      });
      throw error;
    }
  }

  // ==================== STRIPE CONNECT ====================

  /**
   * Crear Transfer a cuenta Stripe Connect
   */
  async createTransfer(params: {
    amount: number;
    currency: string;
    destination: string; // Stripe Connect Account ID
    description?: string;
    metadata?: Record<string, string>;
    sourceTransaction?: string; // Charge ID opcional
  }): Promise<Stripe.Transfer> {
    try {
      const transfer = await stripe.transfers.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        destination: params.destination,
        description: params.description,
        metadata: params.metadata || {},
        ...(params.sourceTransaction && {
          source_transaction: params.sourceTransaction,
        }),
      });

      logger.info("Transfer creado", "STRIPE_PROVIDER", {
        transferId: transfer.id,
        amount: params.amount,
        destination: params.destination,
      });

      return transfer;
    } catch (error: any) {
      logger.error("Error creando transfer", "STRIPE_PROVIDER", {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Recuperar Transfer
   */
  async retrieveTransfer(transferId: string): Promise<Stripe.Transfer> {
    try {
      return await stripe.transfers.retrieve(transferId);
    } catch (error: any) {
      logger.error("Error recuperando transfer", "STRIPE_PROVIDER", {
        transferId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Crear Payout (retiro a cuenta bancaria del artista)
   * Nota: Este método se ejecuta en el contexto de la cuenta Connect del artista
   */
  async createPayout(
    params: {
      amount: number;
      currency: string;
      description?: string;
      metadata?: Record<string, string>;
    },
    stripeAccountId: string
  ): Promise<Stripe.Payout> {
    try {
      const payout = await stripe.payouts.create(
        {
          amount: params.amount,
          currency: params.currency.toLowerCase(),
          description: params.description,
          metadata: params.metadata || {},
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      logger.info("Payout creado", "STRIPE_PROVIDER", {
        payoutId: payout.id,
        amount: params.amount,
        stripeAccountId,
      });

      return payout;
    } catch (error: any) {
      logger.error("Error creando payout", "STRIPE_PROVIDER", {
        error: error.message,
        code: error.code,
        stripeAccountId,
      });
      throw error;
    }
  }

  /**
   * Recuperar Payout
   */
  async retrievePayout(
    payoutId: string,
    stripeAccountId?: string
  ): Promise<Stripe.Payout> {
    try {
      const options = stripeAccountId
        ? { stripeAccount: stripeAccountId }
        : {};
      return await stripe.payouts.retrieve(payoutId, options);
    } catch (error: any) {
      logger.error("Error recuperando payout", "STRIPE_PROVIDER", {
        payoutId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtener balance de cuenta Connect
   */
  async getAccountBalance(
    stripeAccountId: string
  ): Promise<Stripe.Balance> {
    try {
      return await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });
    } catch (error: any) {
      logger.error("Error obteniendo balance", "STRIPE_PROVIDER", {
        stripeAccountId,
        error: error.message,
      });
      throw error;
    }
  }
}

export const stripeProvider = new StripeProvider();

