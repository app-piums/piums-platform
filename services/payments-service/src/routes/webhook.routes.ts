import { Router, Request, Response } from "express";
import { stripeProvider } from "../providers/stripe.provider";
import { paymentService } from "../services/payment.service";
import { logger } from "../utils/logger";
import { webhookLimiter } from "../middleware/rateLimiter";
import { PrismaClient, PaymentType } from "@prisma/client";

const router: Router = Router();
const prisma = new PrismaClient();

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

      // Registrar evento
      await prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: event.data as any,
        },
      });

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

export default router;
