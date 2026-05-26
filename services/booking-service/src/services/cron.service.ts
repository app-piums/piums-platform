import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { withCronLock } from "../utils/distributedLock";
import { bookingService } from "./booking.service";
import { paymentsClient } from "../clients/payments.client";
import { notificationsClient } from "../clients/notifications.client";
import { usersClient } from "../clients/users.client";
import { artistsClient } from "../clients/artists.client";
import { catalogClient } from "../clients/catalog.client";

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
            message: `Tienes un saldo pendiente de $${(remaining / 100).toFixed(2)} para tu reserva #${booking.code || booking.id}. Por favor, completa el pago a tiempo.`,
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
        message: `Tu evento es en menos de 48 horas y aún tienes un saldo pendiente de $${(remaining / 100).toFixed(2)} para la reserva #${booking.code || booking.id}. Completa el pago lo antes posible.`,
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
        message: `Hay un saldo de $${(remaining / 100).toFixed(2)} aún por cobrar para la reserva #${booking.code || booking.id}. El evento es en menos de 48 horas. Nuestro equipo está gestionando el cobro.`,
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
        title: "Pago crítico — soporte activado",
        message: `Tu evento es en menos de 24 horas y el saldo de $${(remaining / 100).toFixed(2)} para la reserva #${booking.code || booking.id} sigue pendiente. Nuestro equipo de soporte se pondrá en contacto contigo.`,
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

// ==================== RECORDATORIOS MULTI-ETAPA ====================
// Cada hora: envía recordatorios a cliente y artista en múltiples intervalos
// (7 días, 3 días, mismo día para cliente; 7d, 3d, 24h, mismodia para artista)

async function buildReminderPayload(booking: {
  id: string;
  code: string | null;
  clientId: string;
  artistId: string;
  serviceId: string;
  scheduledDate: Date;
  durationMinutes: number;
  location: string | null;
}) {
  const [clientUser, artistProfile, service] = await Promise.all([
    usersClient.getUser(booking.clientId).catch(() => null),
    artistsClient.getArtist(booking.artistId).catch(() => null),
    catalogClient.getService(booking.serviceId).catch(() => null),
  ]);

  return {
    bookingId: booking.id,
    bookingCode: booking.code || booking.id,
    clientId: booking.clientId,
    clientName: (clientUser as any)?.fullName || (clientUser as any)?.firstName || 'Cliente',
    clientEmail: (clientUser as any)?.email || '',
    artistId: booking.artistId,
    artistName: (artistProfile as any)?.artistName || 'el artista',
    artistEmail: (artistProfile as any)?.email || (artistProfile as any)?.user?.email || '',
    artistCategory: (artistProfile as any)?.category || '',
    artistImage: (artistProfile as any)?.profileImage || '',
    serviceName: (service as any)?.name || (service as any)?.title || `Reserva #${booking.code || booking.id}`,
    scheduledDate: booking.scheduledDate.toISOString(),
    durationMinutes: booking.durationMinutes,
    location: booking.location || '',
    servicePrice: 0,
    totalPrice: 0,
    currency: 'GTQ',
    depositRequired: false,
  };
}

async function runReminder7d() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (7 * 24 * 60 - 60) * 60 * 1000); // 7d - 1h
  const windowEnd = new Date(now.getTime() + (7 * 24 * 60 + 60) * 60 * 1000);   // 7d + 1h

  try {
    const bookings = await (prisma as any).booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: windowStart, lte: windowEnd },
        reminderSent7d: false,
        deletedAt: null,
      },
      select: { id: true, code: true, clientId: true, artistId: true, serviceId: true, scheduledDate: true, durationMinutes: true, location: true },
    });

    for (const booking of bookings) {
      try {
        const payload = await buildReminderPayload(booking);
        if (payload.clientEmail) {
          await notificationsClient.sendReminder7d(payload);
        }
        await (prisma as any).booking.update({ where: { id: booking.id }, data: { reminderSent7d: true } });
        logger.info('7d reminder enviado', 'CRON_REMINDER', { bookingId: booking.id });
      } catch (err: any) {
        logger.error('Error enviando 7d reminder', 'CRON_REMINDER', { bookingId: booking.id, error: err.message });
      }
    }
  } catch (err: any) {
    logger.error('Error en cron reminder 7d', 'CRON_REMINDER', { error: err.message });
  }
}

async function runReminder3d() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (3 * 24 * 60 - 60) * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (3 * 24 * 60 + 60) * 60 * 1000);

  try {
    const bookings = await (prisma as any).booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: windowStart, lte: windowEnd },
        reminderSent3d: false,
        deletedAt: null,
      },
      select: { id: true, code: true, clientId: true, artistId: true, serviceId: true, scheduledDate: true, durationMinutes: true, location: true },
    });

    for (const booking of bookings) {
      try {
        const payload = await buildReminderPayload(booking);
        if (payload.clientEmail) {
          await notificationsClient.sendReminder3d(payload);
        }
        await (prisma as any).booking.update({ where: { id: booking.id }, data: { reminderSent3d: true } });
        logger.info('3d reminder enviado', 'CRON_REMINDER', { bookingId: booking.id });
      } catch (err: any) {
        logger.error('Error enviando 3d reminder', 'CRON_REMINDER', { bookingId: booking.id, error: err.message });
      }
    }
  } catch (err: any) {
    logger.error('Error en cron reminder 3d', 'CRON_REMINDER', { error: err.message });
  }
}

async function runReminderSameDay() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  try {
    const bookings = await (prisma as any).booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: todayStart, lte: todayEnd },
        reminderSentSameDay: false,
        deletedAt: null,
      },
      select: { id: true, code: true, clientId: true, artistId: true, serviceId: true, scheduledDate: true, durationMinutes: true, location: true },
    });

    for (const booking of bookings) {
      try {
        const payload = await buildReminderPayload(booking);
        if (payload.clientEmail) {
          await notificationsClient.sendReminderSameDay(payload);
        }
        await (prisma as any).booking.update({ where: { id: booking.id }, data: { reminderSentSameDay: true } });
        logger.info('Same-day reminder enviado', 'CRON_REMINDER', { bookingId: booking.id });
      } catch (err: any) {
        logger.error('Error enviando same-day reminder', 'CRON_REMINDER', { bookingId: booking.id, error: err.message });
      }
    }
  } catch (err: any) {
    logger.error('Error en cron reminder same-day', 'CRON_REMINDER', { error: err.message });
  }
}

async function runArtistReminders() {
  const now = new Date();

  // Ventanas de tiempo para cada nivel
  const windows = [
    {
      flag: 'artistReminderSent7d' as const,
      daysLabel: 'en 7 dias',
      start: new Date(now.getTime() + (7 * 24 * 60 - 60) * 60 * 1000),
      end: new Date(now.getTime() + (7 * 24 * 60 + 60) * 60 * 1000),
    },
    {
      flag: 'artistReminderSent3d' as const,
      daysLabel: 'en 3 dias',
      start: new Date(now.getTime() + (3 * 24 * 60 - 60) * 60 * 1000),
      end: new Date(now.getTime() + (3 * 24 * 60 + 60) * 60 * 1000),
    },
    {
      flag: 'artistReminderSent24h' as const,
      daysLabel: 'manana',
      start: new Date(now.getTime() + (24 * 60 - 60) * 60 * 1000),
      end: new Date(now.getTime() + (24 * 60 + 60) * 60 * 1000),
    },
    {
      flag: 'artistReminderSentSameDay' as const,
      daysLabel: 'hoy',
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    },
  ];

  for (const { flag, daysLabel, start, end } of windows) {
    try {
      const where: Record<string, any> = {
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        scheduledDate: { gte: start, lte: end },
        deletedAt: null,
      };
      where[flag] = false;

      const bookings = await (prisma as any).booking.findMany({
        where,
        select: { id: true, code: true, clientId: true, artistId: true, serviceId: true, scheduledDate: true, durationMinutes: true, location: true },
      });

      for (const booking of bookings) {
        try {
          const payload = await buildReminderPayload(booking);
          if (payload.artistEmail) {
            await notificationsClient.sendArtistReminder(payload, daysLabel);
          }
          await (prisma as any).booking.update({ where: { id: booking.id }, data: { [flag]: true } });
          logger.info(`Artist reminder (${daysLabel}) enviado`, 'CRON_REMINDER', { bookingId: booking.id });
        } catch (err: any) {
          logger.error(`Error enviando artist reminder (${daysLabel})`, 'CRON_REMINDER', { bookingId: booking.id, error: err.message });
        }
      }
    } catch (err: any) {
      logger.error(`Error en cron artist reminder (${daysLabel})`, 'CRON_REMINDER', { error: err.message });
    }
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
        serviceId: true,
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

        // Pago hold: 24h ventana de confirmacion de entrega
        const holdUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        ;(async () => {
          try {
            await paymentsClient.schedulePayoutHold(booking.id, holdUntil.toISOString());

            const [clientUser, artistProfile, service] = await Promise.all([
              usersClient.getUser(booking.clientId).catch(() => null),
              artistsClient.getArtist(booking.artistId).catch(() => null),
              catalogClient.getService(booking.serviceId).catch(() => null),
            ]);

            const clientEmail = (clientUser as any)?.email;
            if (!clientEmail) return;

            const clientName = (clientUser as any)?.fullName || (clientUser as any)?.nombre || (clientUser as any)?.firstName || 'Cliente';
            const artistName = (artistProfile as any)?.artistName || 'el artista';
            const serviceName = (service as any)?.name || (service as any)?.title || `Reserva #${booking.code || booking.id}`;
            const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
            const confirmUrl = `${clientAppUrl}/bookings/${booking.id}/confirm-delivery`;
            const disputeUrl = `${clientAppUrl}/bookings/${booking.id}/report-problem`;
            const autoReleaseTime = holdUntil.toLocaleString('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'full', timeStyle: 'short' });
            const helpUrl = `${clientAppUrl}/soporte`;

            await notificationsClient.sendDeliveryConfirmationEmail({
              clientEmail,
              clientName,
              artistName,
              serviceName,
              bookingCode: booking.code || booking.id,
              confirmUrl,
              disputeUrl,
              autoReleaseTime,
              helpUrl,
            });

            logger.info("Email confirmacion entrega enviado", "CRON_AUTO_COMPLETE", { bookingId: booking.id, clientEmail });
          } catch (err: any) {
            logger.error("Error en payout hold o email confirmacion", "CRON_AUTO_COMPLETE", { bookingId: booking.id, error: err.message });
          }
        })();

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

// ==================== PAYOUT HOLD AUTO-RELEASE ====================
// Cada hora: libera el hold de payouts cuya ventana de 24h venció
// y el cliente no confirmó entrega (artista siempre cobra).

async function runPayoutHoldRelease() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // hace 24h

  try {
    const bookings = await (prisma as any).booking.findMany({
      where: {
        status: "DELIVERED",
        deliveredAt: { lte: cutoff },
        deliveryConfirmedAt: null,
        deletedAt: null,
      },
      select: { id: true, code: true },
    });

    let released = 0;
    for (const booking of bookings) {
      try {
        await paymentsClient.schedulePayoutHold(booking.id, null);
        released++;
        logger.info("Payout hold liberado automaticamente", "CRON_PAYOUT_RELEASE", { bookingId: booking.id });
      } catch (err: any) {
        logger.error("Error liberando payout hold", "CRON_PAYOUT_RELEASE", { bookingId: booking.id, error: err.message });
      }
    }

    if (released > 0) {
      logger.info(`Payout hold release: ${released} payouts liberados`, "CRON_PAYOUT_RELEASE");
    }
  } catch (err: any) {
    logger.error("Error en cron payout hold release", "CRON_PAYOUT_RELEASE", { error: err.message });
  }
}

// ==================== SCHEDULER ====================

export function startCronJobs() {
  // No-show auto-actions: cada hora
  setInterval(() => withCronLock('no-show', 3300, runNoShowAutoActions).catch(() => {}), 60 * 60 * 1000);

  // 72h pre-event charge: cada hora
  setInterval(() => withCronLock('pre-event-charge', 3300, runPreEventCharge).catch(() => {}), 60 * 60 * 1000);

  // Escalación de pago fallido (T-48h y T-24h): cada hora
  setInterval(() => withCronLock('payment-escalation', 3300, runPaymentEscalation).catch(() => {}), 60 * 60 * 1000);

  // Auto-complete de bookings IN_PROGRESS: cada hora
  setInterval(() => withCronLock('auto-complete', 3300, runAutoComplete).catch(() => {}), 60 * 60 * 1000);

  // Liberacion automatica de payout hold tras 24h sin confirmacion: cada hora
  setInterval(() => withCronLock('payout-hold-release', 3300, runPayoutHoldRelease).catch(() => {}), 60 * 60 * 1000);

  // Recordatorios multi-etapa (cliente 7d/3d/sameday + artista 7d/3d/24h/sameday): cada hora
  setInterval(() => withCronLock('reminder-7d', 3300, runReminder7d).catch(() => {}), 60 * 60 * 1000);
  setInterval(() => withCronLock('reminder-3d', 3300, runReminder3d).catch(() => {}), 60 * 60 * 1000);
  setInterval(() => withCronLock('reminder-same-day', 3300, runReminderSameDay).catch(() => {}), 60 * 60 * 1000);
  setInterval(() => withCronLock('artist-reminders', 3300, runArtistReminders).catch(() => {}), 60 * 60 * 1000);

  // Ejecutar inmediatamente al iniciar (con delay para que el servidor arranque)
  setTimeout(() => {
    withCronLock('no-show-boot', 3300, runNoShowAutoActions).catch(() => {});
    withCronLock('pre-event-charge-boot', 3300, runPreEventCharge).catch(() => {});
    withCronLock('payment-escalation-boot', 3300, runPaymentEscalation).catch(() => {});
    withCronLock('auto-complete-boot', 3300, runAutoComplete).catch(() => {});
    withCronLock('payout-hold-release-boot', 3300, runPayoutHoldRelease).catch(() => {});
    withCronLock('reminder-7d-boot', 3300, runReminder7d).catch(() => {});
    withCronLock('reminder-3d-boot', 3300, runReminder3d).catch(() => {});
    withCronLock('reminder-same-day-boot', 3300, runReminderSameDay).catch(() => {});
    withCronLock('artist-reminders-boot', 3300, runArtistReminders).catch(() => {});
  }, 30 * 1000); // 30s después del boot

  logger.info("Cron jobs iniciados (no-show + cobro 72h + escalacion pagos + auto-complete + payout hold release + recordatorios multi-etapa)", "CRON");
}
