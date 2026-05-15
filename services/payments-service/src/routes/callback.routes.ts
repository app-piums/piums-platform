import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { tilopayProvider } from "../providers/tilopay.provider";
import { bookingClient } from "../clients/booking.client";
import { notificationsClient } from "../clients/notifications.client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();
const router: Router = Router();

/**
 * POST /callbacks/tilopay
 * Webhook de Tilopay — notifica el resultado de un pago.
 *
 * Tilopay envía (entre otros campos):
 *   orderNumber    — nuestro orderNumber original (piums_${bookingId}_${ts})
 *   orderId        — ID interno de Tilopay (usado en OrderHash V2)
 *   responseCode   — "00" = aprobado, otros = rechazado/error
 *   auth           — código de autorización
 *   amount / currency / email
 *   orderHash      — firma HMAC-SHA256 V2
 *
 * Verificación OrderHash V2:
 *   key     = "{orderId}|{TILOPAY_API_KEY}|{TILOPAY_API_SECRET}"
 *   message = url-query de: api_Key, api_user, orderId, external_orden_id,
 *             amount, currency, responseCode, auth, email
 *   hash    = HMAC-SHA256(key, message) → hex lowercase
 */
router.post(
  "/tilopay",
  async (req: Request, res: Response, _next: NextFunction) => {
    // Responder 200 rápido — Tilopay reintenta si no recibe respuesta pronto
    res.status(200).json({ received: true });

    try {
      const body = req.body as Record<string, any>;

      const {
        orderId,          // ID interno de Tilopay (usado en el hash)
        orderNumber,      // nuestro orderNumber: "piums_${bookingId}_${ts}"
        external_orden_id,
        responseCode,     // "00" = aprobado
        auth,
        amount,
        currency,
        email,
        orderHash,
      } = body;

      // ── Verificación OrderHash V2 — obligatoria ───────────────────────────
      if (!orderHash) {
        logger.error("Tilopay webhook rechazado: falta orderHash", "CALLBACK_TILOPAY", { orderId, orderNumber });
        return;
      }

      const valid = tilopayProvider.verifyOrderHashV2({
        orderId,
        external_orden_id,
        amount,
        currency,
        responseCode,
        auth,
        email,
        orderHash,
      });
      if (!valid) {
        logger.error("Tilopay webhook: OrderHash V2 inválido — descartando", "CALLBACK_TILOPAY", {
          orderId,
          orderHash: String(orderHash).slice(0, 8) + "…",
        });
        return;
      }

      if (!orderNumber && !orderId) {
        logger.warn("Tilopay webhook: payload sin orderNumber ni orderId", "CALLBACK_TILOPAY", { body });
        return;
      }

      // Extraer bookingId del orderNumber: "piums_${bookingId}_${timestamp}"
      const ourOrderNumber: string = orderNumber || external_orden_id || '';
      const bookingId = ourOrderNumber.startsWith('piums_')
        ? ourOrderNumber.split('_')[1]
        : undefined;

      // responseCode "00" = aprobado — Tilopay no siempre envía campo "status"
      const approved = responseCode === '00';
      const providerRef = orderId || ourOrderNumber;

      logger.info("Tilopay webhook recibido", "CALLBACK_TILOPAY", {
        orderId, orderNumber, responseCode, approved, bookingId,
      });

      if (approved) {
        const amountCents = Math.round(parseFloat(amount) * 100);

        // Guardar registro de pago
        const existing = await (prisma as any).paymentIntent.findFirst({
          where: { stripePaymentIntentId: providerRef },
        }).catch(() => null);

        if (!existing && bookingId) {
          await (prisma as any).paymentIntent.create({
            data: {
              stripePaymentIntentId: providerRef,
              userId: 'tilopay',       // se actualiza cuando booking-service confirma
              bookingId,
              amount: amountCents,
              currency: currency || "USD",
              status: "SUCCEEDED",
              metadata: { provider: "TILOPAY", orderNumber: ourOrderNumber },
            },
          }).catch((err: any) => logger.error("Error guardando paymentIntent Tilopay", "CALLBACK_TILOPAY", { error: err.message }));
        } else if (existing) {
          await (prisma as any).paymentIntent.update({
            where: { id: existing.id },
            data: { status: "SUCCEEDED" },
          }).catch(() => null);
        }

        // Notificar al booking-service.
        // Sin paymentType explícito: booking-service determina ANTICIPO_PAID vs FULLY_PAID
        // comparando amountCents con anticipoAmount / totalPrice del booking.
        if (bookingId) {
          await bookingClient.markPayment(
            bookingId,
            amountCents,
            "TILOPAY",
            providerRef,
          ).catch((err: any) =>
            logger.error("Error notificando booking-service del pago Tilopay", "CALLBACK_TILOPAY", {
              bookingId, error: err.message,
            })
          );
        }

        logger.info("Pago Tilopay aprobado procesado", "CALLBACK_TILOPAY", {
          providerRef, bookingId, amountCents,
        });

      } else {
        // Pago rechazado o error
        logger.warn("Pago Tilopay no aprobado", "CALLBACK_TILOPAY", {
          providerRef, responseCode, bookingId,
        });

        if (bookingId) {
          // Intentar notificar al cliente — el booking sigue en estado pendiente
          notificationsClient.sendNotification({
            userId: bookingId,  // fallback hasta tener userId real
            type: "PAYMENT_REMAINING_FAILED",
            channel: "IN_APP",
            title: "Pago no procesado",
            message: `Tu pago no pudo ser procesado (código ${responseCode}). Por favor intenta de nuevo.`,
            data: { providerRef, bookingId, responseCode },
            priority: "high",
            category: "payment",
          }).catch(() => {});
        }
      }

    } catch (err: any) {
      logger.error("Error procesando webhook Tilopay", "CALLBACK_TILOPAY", { error: err.message });
    }
  }
);

export default router;
