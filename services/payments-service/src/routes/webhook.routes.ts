import { Router, Request, Response } from "express";
import { stripeProvider } from "../providers/stripe.provider";
import { paymentService } from "../services/payment.service";
import { bookingClient } from "../clients/booking.client";
import { PaymentMethodService } from "../services/paymentMethod.service";
import { logger } from "../utils/logger";
import { webhookLimiter } from "../middleware/rateLimiter";
import prisma from "../lib/prisma";
import { PaymentType } from "../types/prisma-enums";

const paymentMethodService = new PaymentMethodService();

const router: Router = Router();

/**
 * Webhook de Stripe
 * IMPORTANTE: Este endpoint debe recibir el body raw, no parseado como JSON
 */
router.post(
  "/stripe",
  webhookLimiter,
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["stripe-signature"] as string;

      if (!signature) {
        logger.warn("Webhook sin signature", "WEBHOOK_HANDLER");
        return res.status(400).send("Missing stripe-signature header");
      }

      // Verificar signature
      const event = stripeProvider.verifyWebhookSignature(
        req.body,
        signature
      );

      // Idempotency guard: fast path — if already successfully processed, skip
      const alreadyProcessed = await prisma.webhookEvent.findFirst({
        where: { stripeEventId: event.id, processed: true },
      });
      if (alreadyProcessed) {
        logger.info("Webhook ya procesado, ignorando", "WEBHOOK_HANDLER", { eventId: event.id });
        return res.json({ received: true });
      }

      // Registrar evento
      try {
        await prisma.webhookEvent.create({
          data: {
            stripeEventId: event.id,
            eventType: event.type,
            payload: event.data as any,
          },
        });
      } catch (createErr: any) {
        // Unique constraint means the event already exists — check if processed
        const existing = await prisma.webhookEvent.findFirst({
          where: { stripeEventId: event.id, processed: true },
        });
        if (existing) {
          logger.info("Webhook duplicado ya procesado", "WEBHOOK_HANDLER", { eventId: event.id });
          return res.json({ received: true });
        }
        // Exists but not yet processed — let the current run continue
      }

      logger.info("Webhook recibido", "WEBHOOK_HANDLER", {
        eventId: event.id,
        eventType: event.type,
      });

      // Procesar evento según tipo
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(event);
          break;

        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(event);
          break;

        case "charge.refunded":
          await handleChargeRefunded(event);
          break;

        case "payment_intent.canceled":
          await handlePaymentIntentCanceled(event);
          break;

        case "payment_intent.amount_capturable_updated":
          await handleAmountCapturableUpdated(event);
          break;

        default:
          logger.debug("Evento no manejado", "WEBHOOK_HANDLER", {
            eventType: event.type,
          });
      }

      // Marcar como procesado
      await prisma.webhookEvent.updateMany({
        where: { stripeEventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });

      res.json({ received: true });
      return;
    } catch (error: any) {
      logger.error("Error procesando webhook", "WEBHOOK_HANDLER", {
        error: error.message,
      });

      // Registrar error en webhook event si existe
      if (req.body && req.body.id) {
        await prisma.webhookEvent
          .updateMany({
            where: { stripeEventId: req.body.id },
            data: {
              error: error.message,
              retries: { increment: 1 },
            },
          })
          .catch(() => {});
      }

      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

// ==================== EVENT HANDLERS ====================

async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;

  logger.info("Payment Intent succeeded", "WEBHOOK_HANDLER", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  });

  // Registrar pago
  try {
    // Determinar tipo de pago desde metadata
    const paymentType: PaymentType =
      paymentIntent.metadata?.paymentType || "FULL_PAYMENT";

    await paymentService.recordPayment({
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency.toUpperCase(),
      paymentType,
      paymentMethod: paymentIntent.payment_method_types?.[0],
      paymentMethodDetails: paymentIntent.payment_method,
      metadata: paymentIntent.metadata,
    });

    logger.info("Pago registrado desde webhook", "WEBHOOK_HANDLER", {
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    logger.error("Error registrando pago desde webhook", "WEBHOOK_HANDLER", {
      paymentIntentId: paymentIntent.id,
      error: error.message,
    });
  }
}

async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;

  logger.warn("Payment Intent failed", "WEBHOOK_HANDLER", {
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error,
  });

  // Actualizar payment intent
  await prisma.paymentIntent.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "FAILED",
    },
  });
}

async function handleChargeRefunded(event: any) {
  const charge = event.data.object;

  logger.info("Charge refunded", "WEBHOOK_HANDLER", {
    chargeId: charge.id,
    amount: charge.amount_refunded,
  });

  // Actualizar refund si existe
  const refund = charge.refunds?.data?.[0];
  if (refund) {
    await prisma.refund.updateMany({
      where: { stripeRefundId: refund.id },
      data: {
        status: refund.status === "succeeded" ? "SUCCEEDED" : "FAILED",
        processedAt: new Date(),
      },
    });
  }
}

async function handlePaymentIntentCanceled(event: any) {
  const paymentIntent = event.data.object;

  logger.info("Payment Intent canceled", "WEBHOOK_HANDLER", {
    paymentIntentId: paymentIntent.id,
  });

  await prisma.paymentIntent.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });
}

/**
 * payment_intent.amount_capturable_updated
 * Se dispara cuando el PI entra en estado requires_capture (tarjeta pre-autorizada).
 * Marcamos el booking como CARD_AUTHORIZED: fondos retenidos, esperando artista.
 */
async function handleAmountCapturableUpdated(event: any) {
  const paymentIntent = event.data.object;
  const bookingId: string | undefined = paymentIntent.metadata?.bookingId;
  const paymentMethodId: string | undefined = paymentIntent.payment_method;

  logger.info("Payment Intent requires_capture (pre-auth)", "WEBHOOK_HANDLER", {
    paymentIntentId: paymentIntent.id,
    amountCapturable: paymentIntent.amount_capturable,
    bookingId,
    paymentMethodId,
  });

  await prisma.paymentIntent.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: "REQUIRES_CAPTURE" },
  });

  if (bookingId) {
    await bookingClient.markCardAuthorized(bookingId, paymentIntent.id).catch((err: any) =>
      logger.error("Error marcando CARD_AUTHORIZED desde webhook Stripe", "WEBHOOK_HANDLER", {
        bookingId, paymentIntentId: paymentIntent.id, error: err.message,
      })
    );

    // Guardar el PM de Stripe para el cobro automático del saldo (cron 72h pre-evento).
    // Sin este paso, chargeRemainingBalance() no encuentra ningún método guardado.
    if (paymentMethodId) {
      const booking = await bookingClient.getBooking(bookingId).catch(() => null);
      if (booking?.clientId) {
        try {
          const stripeMethod = await stripeProvider.retrievePaymentMethod(paymentMethodId);
          await paymentMethodService.saveProviderToken(booking.clientId, {
            provider: 'STRIPE',
            token: paymentMethodId,
            cardBrand: stripeMethod.card?.brand,
            cardLast4: stripeMethod.card?.last4,
            cardExpMonth: stripeMethod.card?.exp_month,
            cardExpYear: stripeMethod.card?.exp_year,
          });
          logger.info("PM Stripe guardado tras pre-auth", "WEBHOOK_HANDLER", {
            bookingId, userId: booking.clientId, paymentMethodId,
          });
        } catch (err: any) {
          logger.error("Error guardando PM Stripe tras pre-auth", "WEBHOOK_HANDLER", {
            bookingId, paymentMethodId, error: err.message,
          });
        }
      }
    }
  }
}

export default router;
