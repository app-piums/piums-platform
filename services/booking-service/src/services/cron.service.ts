import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { bookingService } from "./booking.service";
import { paymentsClient } from "../clients/payments.client";
import { notificationsClient } from "../clients/notifications.client";

const prisma = new PrismaClient();

// ==================== NO-SHOW 24H ====================
// Cada hora: ejecuta acciones automáticas de no-show si el artista
// no respondió la disputa en 24 horas.

async function runNoShowAutoActions() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // hace 24h

  try {
    const pendingDisputes = await prisma.dispute.findMany({
      where: {
        disputeType: "ARTIST_NO_SHOW",
        status: "OPEN",
        createdAt: { lte: cutoff },
        deletedAt: null,
      },
      select: { id: true, bookingId: true },
    });

    for (const dispute of pendingDisputes) {
      try {
        await bookingService.executeNoShowActions(dispute.bookingId, dispute.id);
        logger.info("No-show auto-action completada", "CRON_NO_SHOW", {
          bookingId: dispute.bookingId,
          disputeId: dispute.id,
        });
      } catch (err: any) {
        logger.error("Error en no-show auto-action", "CRON_NO_SHOW", {
          bookingId: dispute.bookingId,
          disputeId: dispute.id,
          error: err.message,
        });
      }
    }

    if (pendingDisputes.length > 0) {
      logger.info(`No-show cron: procesadas ${pendingDisputes.length} disputas`, "CRON_NO_SHOW");
    }
  } catch (err: any) {
    logger.error("Error en cron no-show", "CRON_NO_SHOW", { error: err.message });
  }
}

// ==================== 72H PRE-EVENT CHARGE ====================
// Cada hora: cobra el saldo restante a bookings con anticipo pagado
// cuya fecha está dentro de las próximas 72h.

async function runPreEventCharge() {
  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: "ANTICIPO_PAID" as any,
        scheduledDate: { gt: now, lte: in72h },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        clientId: true,
        artistId: true,
        totalPrice: true,
        paidAmount: true,
        savedCardToken: true,
        currency: true,
      },
    });

    for (const booking of bookings) {
      const remaining = booking.totalPrice - booking.paidAmount;
      if (remaining <= 0) continue;

      try {
        if (booking.savedCardToken) {
          // Intentar cobro automático con tarjeta guardada
          const result = await paymentsClient.createPaymentIntent({
            bookingId: booking.id,
            amount: remaining,
            currency: booking.currency || "USD",
            paymentType: "REMAINING",
            userId: booking.clientId,
          });

          if (result) {
            logger.info("Cobro 72h iniciado", "CRON_72H", {
              bookingId: booking.id,
              remaining,
            });
          } else {
            throw new Error("createPaymentIntent devolvió null");
          }
        } else {
          // Sin tarjeta guardada: notificar al cliente
          notificationsClient.sendNotification({
            userId: booking.clientId,
            type: "PAYMENT_REMAINING_DUE",
            channel: "IN_APP",
            title: "Pago pendiente",
            message: `Tienes un saldo pendiente de $${(remaining / 100).toFixed(2)} USD para tu reserva #${booking.code || booking.id}. Por favor, completa el pago a tiempo.`,
            data: { bookingId: booking.id, amount: remaining },
            priority: "high",
            category: "payment",
          }).catch(err => logger.error("Error notificando cobro 72h", "CRON_72H", { error: err.message }));

          logger.info("Cliente notificado: saldo pendiente 72h", "CRON_72H", {
            bookingId: booking.id,
            remaining,
          });
        }
      } catch (err: any) {
        // Cobro fallido: notificar al cliente y registrar
        notificationsClient.sendNotification({
          userId: booking.clientId,
          type: "PAYMENT_REMAINING_FAILED",
          channel: "IN_APP",
          title: "Error en cobro automático",
          message: `No pudimos procesar el pago restante para tu reserva #${booking.code || booking.id}. Nuestro equipo de soporte se pondrá en contacto.`,
          data: { bookingId: booking.id, amount: remaining },
          priority: "high",
          category: "payment",
        }).catch(() => { /* ya logueado abajo */ });

        logger.error("Cobro 72h fallido", "CRON_72H", {
          bookingId: booking.id,
          error: err.message,
        });
      }
    }

    if (bookings.length > 0) {
      logger.info(`72h cron: procesados ${bookings.length} bookings`, "CRON_72H");
    }
  } catch (err: any) {
    logger.error("Error en cron 72h pre-event", "CRON_72H", { error: err.message });
  }
}

// ==================== PAYMENT ESCALATION ====================
// Cada hora: escala los pagos restantes no completados.
// T-48h: notifica al artista + recordatorio urgente al cliente.
// T-24h: escala a soporte (notificación de soporte al admin/cliente).

async function runPaymentEscalation() {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Bookings con anticipo pagado pero saldo restante pendiente dentro de 48h
    const bookings48h = await prisma.booking.findMany({
      where: {
        paymentStatus: "ANTICIPO_PAID" as any,
        scheduledDate: { gt: in24h, lte: in48h },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        clientId: true,
        artistId: true,
        totalPrice: true,
        paidAmount: true,
        currency: true,
      },
    });

    for (const booking of bookings48h) {
      const remaining = booking.totalPrice - booking.paidAmount;
      if (remaining <= 0) continue;

      // Notificar al cliente: recordatorio urgente
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: "PAYMENT_MANUAL_REQUIRED",
        channel: "IN_APP",
        title: "Pago urgente requerido",
        message: `Tu evento es en menos de 48 horas y aún tienes un saldo pendiente de ${booking.currency} ${(remaining / 100).toFixed(2)} para la reserva #${booking.code || booking.id}. Completa el pago lo antes posible.`,
        data: { bookingId: booking.id, amount: remaining, urgency: "48h" },
        priority: "urgent",
        category: "payment",
      }).catch(err => logger.error("Error notificando T-48h cliente", "CRON_ESCALATION", { error: err.message }));

      // Notificar al artista: saldo no cobrado, cliente alertado
      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: "PAYMENT_MANUAL_REQUIRED",
        channel: "IN_APP",
        title: "Saldo pendiente en tu reserva",
        message: `Hay un saldo de ${booking.currency} ${(remaining / 100).toFixed(2)} aún por cobrar para la reserva #${booking.code || booking.id}. El evento es en menos de 48 horas. Nuestro equipo está gestionando el cobro.`,
        data: { bookingId: booking.id, amount: remaining, urgency: "48h" },
        priority: "high",
        category: "payment",
      }).catch(err => logger.error("Error notificando T-48h artista", "CRON_ESCALATION", { error: err.message }));

      logger.info("Escalada T-48h enviada", "CRON_ESCALATION", { bookingId: booking.id, remaining });
    }

    // Bookings con anticipo pagado pero saldo pendiente dentro de 24h → escalar a soporte
    const bookings24h = await prisma.booking.findMany({
      where: {
        paymentStatus: "ANTICIPO_PAID" as any,
        scheduledDate: { gt: now, lte: in24h },
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        clientId: true,
        artistId: true,
        totalPrice: true,
        paidAmount: true,
        currency: true,
      },
    });

    for (const booking of bookings24h) {
      const remaining = booking.totalPrice - booking.paidAmount;
      if (remaining <= 0) continue;

      // Notificar al cliente: escalada final
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: "PAYMENT_MANUAL_REQUIRED",
        channel: "IN_APP",
        title: "⚠️ Pago crítico — soporte activado",
        message: `Tu evento es en menos de 24 horas y el saldo de ${booking.currency} ${(remaining / 100).toFixed(2)} para la reserva #${booking.code || booking.id} sigue pendiente. Nuestro equipo de soporte se pondrá en contacto contigo.`,
        data: { bookingId: booking.id, amount: remaining, urgency: "24h", escalated: true },
        priority: "urgent",
        category: "payment",
      }).catch(err => logger.error("Error notificando T-24h cliente", "CRON_ESCALATION", { error: err.message }));

      logger.warn("Escalada T-24h — soporte requerido", "CRON_ESCALATION", {
        bookingId: booking.id,
        code: booking.code,
        remaining,
      });
    }

    const total = bookings48h.length + bookings24h.length;
    if (total > 0) {
      logger.info(`Escalación de pagos: ${bookings48h.length} T-48h, ${bookings24h.length} T-24h`, "CRON_ESCALATION");
    }
  } catch (err: any) {
    logger.error("Error en cron escalación de pagos", "CRON_ESCALATION", { error: err.message });
  }
}

// ==================== AUTO-COMPLETE ====================
// Cada hora: si el artista no marcó el servicio como entregado
// transcurridas (durationMinutes + 4h) desde scheduledDate, se
// auto-completa y se notifica al cliente para confirmar o disputar.

async function runAutoComplete() {
  const now = new Date();

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "IN_PROGRESS" as any,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        clientId: true,
        artistId: true,
        scheduledDate: true,
        durationMinutes: true,
      },
    });

    const toComplete = bookings.filter((b: typeof bookings[number]) => {
      const autoCompleteAfter = new Date(
        b.scheduledDate.getTime() + (b.durationMinutes + 4 * 60) * 60 * 1000
      );
      return now >= autoCompleteAfter;
    });

    for (const booking of toComplete) {
      try {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "DELIVERED" as any,
            deliveredAt: now,
          },
        });

        // Notificar al cliente: tiene 24h para confirmar o disputar
        notificationsClient.sendNotification({
          userId: booking.clientId,
          type: "BOOKING_AUTO_COMPLETED",
          channel: "IN_APP",
          title: "Servicio completado automáticamente",
          message: `Tu reserva #${booking.code || booking.id} fue marcada como completada. Si tuviste algún problema, tienes 24 horas para reportarlo en la sección Quejas.`,
          data: { bookingId: booking.id },
          priority: "normal",
          category: "booking",
        }).catch(err => logger.error("Error notificando auto-complete cliente", "CRON_AUTO_COMPLETE", { error: err.message }));

        logger.info("Booking auto-completado", "CRON_AUTO_COMPLETE", { bookingId: booking.id });
      } catch (err: any) {
        logger.error("Error al auto-completar booking", "CRON_AUTO_COMPLETE", {
          bookingId: booking.id,
          error: err.message,
        });
      }
    }

    if (toComplete.length > 0) {
      logger.info(`Auto-complete: ${toComplete.length} bookings procesados`, "CRON_AUTO_COMPLETE");
    }
  } catch (err: any) {
    logger.error("Error en cron auto-complete", "CRON_AUTO_COMPLETE", { error: err.message });
  }
}

// ==================== SCHEDULER ====================

export function startCronJobs() {
  // No-show auto-actions: cada hora
  setInterval(runNoShowAutoActions, 60 * 60 * 1000);

  // 72h pre-event charge: cada hora
  setInterval(runPreEventCharge, 60 * 60 * 1000);

  // Escalación de pago fallido (T-48h y T-24h): cada hora
  setInterval(runPaymentEscalation, 60 * 60 * 1000);

  // Auto-complete de bookings IN_PROGRESS: cada hora
  setInterval(runAutoComplete, 60 * 60 * 1000);

  // Ejecutar inmediatamente al iniciar (con delay para que el servidor arranque)
  setTimeout(() => {
    runNoShowAutoActions().catch(() => {});
    runPreEventCharge().catch(() => {});
    runPaymentEscalation().catch(() => {});
    runAutoComplete().catch(() => {});
  }, 30 * 1000); // 30s después del boot

  logger.info("Cron jobs iniciados (no-show 24h + cobro 72h + escalación pagos + auto-complete)", "CRON");
}
