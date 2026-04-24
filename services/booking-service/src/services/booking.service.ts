import { PrismaClient, BookingStatus, PaymentStatus, RescheduleStatus } from "@prisma/client";
import crypto from "crypto";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { notificationsClient } from "../clients/notifications.client";
import { paymentsClient } from "../clients/payments.client";
import { catalogClient } from "../clients/catalog.client";
import { chatClient } from "../clients/chat.client";
import { generateBookingCode } from "./booking-code.service";
import { usersClient } from "../clients/users.client";
import { artistsClient } from "../clients/artists.client";
import { notifyBookingConfirmed } from "../utils/notifications";
import { createAvailabilityReservation, removeAvailabilityReservation } from "./availability.service";

const prisma = new PrismaClient();

export class BookingService {
  // ==================== RESERVAS ====================

  /**
   * Crear nueva reserva
   */
  async createBooking(data: {
    clientId: string;
    artistId: string;
    serviceId: string;
    scheduledDate: Date;
    durationMinutes: number;
    location?: string;
    locationLat?: number;
    locationLng?: number;
    selectedAddons?: string[];
    clientNotes?: string;
    eventId?: string;
  }) {
    const scheduledDate = new Date(data.scheduledDate);

    // Validar que la fecha sea futura
    if (scheduledDate <= new Date()) {
      throw new AppError(400, "La fecha debe ser en el futuro");
    }

    // Obtener configuración de disponibilidad del artista
    const config = await this.getArtistConfig(data.artistId);

    // Validar tiempo de anticipación mínimo
    const hoursUntilBooking = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilBooking < config.minAdvanceHours) {
      throw new AppError(
        400,
        `Debes reservar con al menos ${config.minAdvanceHours} horas de anticipación`
      );
    }

    // Validar tiempo de anticipación máximo
    const daysUntilBooking = hoursUntilBooking / 24;
    if (daysUntilBooking > config.maxAdvanceDays) {
      throw new AppError(
        400,
        `No puedes reservar con más de ${config.maxAdvanceDays} días de anticipación`
      );
    }

    // Verificar disponibilidad
    const endTime = new Date(scheduledDate.getTime() + data.durationMinutes * 60 * 1000);
    const isAvailable = await this.checkAvailability(
      data.artistId,
      scheduledDate,
      endTime
    );

    if (!isAvailable) {
      throw new AppError(409, "El horario solicitado no está disponible");
    }

    // Generar código único para el booking
    const code = await generateBookingCode();

    // Obtener detalles del artista para coordenadas base
    const artist = await artistsClient.getArtist(data.artistId);
    
    // Resolver ubicación del cliente SOLO si el usuario no proporcionó ninguna ubicación explícitamente
    // Esto mantiene consistencia: una vez seleccionada, no se sobrescribe automáticamente
    const hasExplicitLocation = data.location || data.locationLat || data.locationLng;
    
    if (!hasExplicitLocation && data.clientId) {
      const user = await usersClient.getUser(data.clientId);
      if (user && user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        if (defaultAddr.lat && defaultAddr.lng) {
          data.locationLat = defaultAddr.lat;
          data.locationLng = defaultAddr.lng;
          data.location = defaultAddr.label || defaultAddr.street || `${defaultAddr.city}, ${defaultAddr.country}`;
          logger.info(`Ubicación de cliente resuelta automáticamente: ${data.location}`, "BOOKING_SERVICE", {
            lat: data.locationLat,
            lng: data.locationLng
          });
        }
      }
    }

    let distanceKm = 0;
    if (artist && artist.baseLocationLat && artist.baseLocationLng && data.locationLat && data.locationLng) {
      distanceKm = this.getDistance(
        artist.baseLocationLat,
        artist.baseLocationLng,
        data.locationLat,
        data.locationLng
      );
      logger.info(`Distancia calculada para reserva: ${distanceKm.toFixed(2)} km`, "BOOKING_SERVICE");
    }

    // Obtener precio del servicio desde catalog-service
    const priceQuote = await catalogClient.calculatePrice({
      serviceId: data.serviceId,
      durationMinutes: data.durationMinutes,
      selectedAddonIds: data.selectedAddons || [],
      distanceKm,
    });

    if (!priceQuote) {
      throw new AppError(500, "No se pudo calcular el precio del servicio");
    }

    const servicePrice = priceQuote.breakdown.baseCents;
    const addonsPrice = priceQuote.breakdown.addonsCents + priceQuote.breakdown.travelCents;
    const totalPrice = priceQuote.totalCents;

    // Calcular depósito si es requerido
    const depositRequired = config.requiresDeposit;
    const depositAmount = priceQuote.depositRequiredCents || (depositRequired ? Math.floor(totalPrice * 0.3) : 0);

    // Determinar estado inicial
    const initialStatus = config.autoConfirm ? "CONFIRMED" : "PENDING";

    // Crear la reserva con código y quote snapshot
    const booking = await prisma.booking.create({
      data: {
        code, // Código único generado
        clientId: data.clientId,
        artistId: data.artistId,
        serviceId: data.serviceId,
        scheduledDate,
        durationMinutes: data.durationMinutes,
        location: data.location,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        status: initialStatus,
        servicePrice,
        addonsPrice,
        totalPrice,
        quoteSnapshot: priceQuote as any, // Guardar quote completo
        depositRequired,
        depositAmount,
        selectedAddons: data.selectedAddons || [],
        clientNotes: data.clientNotes,
        paymentStatus: depositRequired ? "PENDING" : "DEPOSIT_PAID",
        eventId: data.eventId || null,
      },
    });

    // Registrar cambio de estado inicial
    await this.recordStatusChange(
      booking.id,
      null,
      initialStatus as BookingStatus,
      data.clientId,
      "Reserva creada"
    );

    // Crear booking items desde el quote
    if (priceQuote.items && priceQuote.items.length > 0) {
      await prisma.bookingItem.createMany({
        data: priceQuote.items.map(item => ({
          bookingId: booking.id,
          type: item.type,
          name: item.name,
          qty: item.qty,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
          metadata: item.metadata || {},
        })),
      });

      logger.info("BookingItems creados desde quote", "BOOKING_SERVICE", {
        bookingId: booking.id,
        itemsCount: priceQuote.items.length,
      });
    }

    // Si se requiere depósito, crear Payment Intent
    let paymentIntent = null;
    if (depositRequired && depositAmount > 0) {
      const paymentIntentResponse = await paymentsClient.createPaymentIntent({
        bookingId: booking.id,
        amount: depositAmount,
        currency: 'GTQ',
        paymentType: 'DEPOSIT',
        userId: data.clientId,
      });

      if (paymentIntentResponse) {
        paymentIntent = paymentIntentResponse.paymentIntent;
        
        // Actualizar booking con el paymentIntentId
        await prisma.booking.update({
          where: { id: booking.id },
          data: { paymentIntentId: paymentIntent.id },
        });

        logger.info("Payment Intent creado para booking", "BOOKING_SERVICE", {
          bookingId: booking.id,
          paymentIntentId: paymentIntent.id,
          amount: depositAmount,
        });
      } else {
        logger.error("Error creando Payment Intent", "BOOKING_SERVICE", {
          bookingId: booking.id,
          depositAmount,
        });
      }
    }

    logger.info("Reserva creada", "BOOKING_SERVICE", {
      bookingId: booking.id,
      clientId: data.clientId,
      artistId: data.artistId,
      status: initialStatus,
      depositRequired,
      paymentIntentCreated: !!paymentIntent,
    });

    // Si la reserva se auto-confirma, bloquear el slot de disponibilidad
    if (initialStatus === "CONFIRMED") {
      const endAt = new Date(scheduledDate);
      endAt.setMinutes(endAt.getMinutes() + data.durationMinutes);
      createAvailabilityReservation({
        artistId: data.artistId,
        bookingId: booking.id,
        startAt: scheduledDate,
        endAt,
      }).catch(err => logger.error("Error creando availability reservation", "BOOKING_SERVICE", { error: err.message }));
    }

    // Enviar notificación de reserva creada
    notificationsClient.sendNotification({
      userId: data.clientId,
      type: 'BOOKING_CREATED',
      channel: 'IN_APP',
      title: 'Reserva Creada',
      message: `Tu reserva ha sido creada y está ${initialStatus === 'CONFIRMED' ? 'confirmada' : 'pendiente de confirmación'}`,
      data: {
        bookingId: booking.id,
        scheduledDate: booking.scheduledDate.toISOString(),
        status: booking.status,
      },
      priority: 'high',
      category: 'booking',
    }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));

    // Notificar al artista
    notificationsClient.sendNotification({
      userId: data.artistId,
      type: 'BOOKING_CREATED',
      channel: 'IN_APP',
      title: 'Nueva Reserva',
      message: `Tienes una nueva reserva ${initialStatus === 'CONFIRMED' ? 'confirmada automáticamente' : 'pendiente de confirmación'}`,
      data: {
        bookingId: booking.id,
        scheduledDate: booking.scheduledDate.toISOString(),
        status: booking.status,
      },
      priority: 'high',
      category: 'booking',
    }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));

    // Crear conversación para el chat
    chatClient.createConversation(data.clientId, data.artistId, booking.id)
      .then(conv => {
        if (conv) {
          logger.info("Conversación de chat creada", "BOOKING_SERVICE", { bookingId: booking.id, conversationId: conv.conversation.id });
        }
      })
      .catch(err => logger.error("Error creando conversación de chat", "BOOKING_SERVICE", { error: err.message }));

    return {
      booking,
      paymentIntent: paymentIntent ? {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      } : null,
    };
  }

  /**
   * Obtener reserva por ID
   */
  async getBookingById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!booking) {
      throw new AppError(404, "Reserva no encontrada");
    }

    return booking;
  }

  /**
   * Obtener reserva por código
   */
  async getBookingByCode(code: string) {
    const booking = await prisma.booking.findUnique({
      where: { code },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!booking) {
      throw new AppError(404, `Reserva no encontrada con código: ${code}`);
    }

    return booking;
  }

  /**
   * Buscar reservas con filtros
   */
  async searchBookings(filters: {
    clientId?: string;
    artistId?: string;
    serviceId?: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    // Filtro de rango de fechas
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = filters.startDate;
      if (filters.endDate) where.scheduledDate.lte = filters.endDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { scheduledDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualizar reserva
   */
  async updateBooking(
    id: string,
    userId: string,
    data: {
      scheduledDate?: Date;
      durationMinutes?: number;
      location?: string;
      locationLat?: number;
      locationLng?: number;
      selectedAddons?: string[];
      clientNotes?: string;
      artistNotes?: string;
      reviewId?: string;
    }
  ) {
    const booking = await this.getBookingById(id);

    // If only setting reviewId (internal service call), skip permission/status checks
    const isReviewIdOnly = data.reviewId && Object.keys(data).length === 1;
    if (!isReviewIdOnly) {
      // Verificar permisos
      if (booking.clientId !== userId && booking.artistId !== userId) {
        throw new AppError(403, "No tienes permiso para modificar esta reserva");
      }

      // No permitir modificaciones si ya está cancelada o completada
      if (
        booking.status === "CANCELLED_CLIENT" ||
        booking.status === "CANCELLED_ARTIST" ||
        booking.status === "COMPLETED" ||
        booking.status === "REJECTED"
      ) {
        throw new AppError(400, "No se puede modificar una reserva cerrada");
      }
    }

    // Si cambia la fecha, verificar disponibilidad
    if (data.scheduledDate) {
      const newDate = new Date(data.scheduledDate);
      const duration = data.durationMinutes || booking.durationMinutes;
      const endTime = new Date(newDate.getTime() + duration * 60 * 1000);

      const isAvailable = await this.checkAvailability(
        booking.artistId,
        newDate,
        endTime,
        id // Excluir esta reserva de la verificación
      );

      if (!isAvailable) {
        throw new AppError(409, "El nuevo horario no está disponible");
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        scheduledDate: data.scheduledDate,
        durationMinutes: data.durationMinutes,
        location: data.location,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        selectedAddons: data.selectedAddons,
        clientNotes: data.clientNotes,
        artistNotes: data.artistNotes,
        reviewId: data.reviewId,
      },
    });

    logger.info("Reserva actualizada", "BOOKING_SERVICE", {
      bookingId: id,
      userId,
    });

    return updated;
  }

  /**
   * Confirmar reserva (por el artista)
   */
  async confirmBooking(id: string, artistId: string, artistNotes?: string) {
    const booking = await this.getBookingById(id);

    if (booking.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para confirmar esta reserva");
    }

    if (booking.status !== "PENDING") {
      throw new AppError(400, "Solo se pueden confirmar reservas pendientes");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedBy: artistId,
        artistNotes,
      },
    });

    await this.recordStatusChange(
      id,
      "PENDING",
      "CONFIRMED",
      artistId,
      "Confirmada por el artista"
    );

    logger.info("Reserva confirmada", "BOOKING_SERVICE", {
      bookingId: id,
      artistId,
    });

    // Bloquear el slot de disponibilidad del artista
    const endAt = new Date(booking.scheduledDate);
    endAt.setMinutes(endAt.getMinutes() + booking.durationMinutes);
    createAvailabilityReservation({
      artistId: booking.artistId,
      bookingId: id,
      startAt: booking.scheduledDate,
      endAt,
    }).catch(err => logger.error("Error creando availability reservation", "BOOKING_SERVICE", { error: err.message }));

    // Enviar notificación al cliente de confirmación con datos reales
    (async () => {
      try {
        const [user, artist, service] = await Promise.all([
          usersClient.getUser(booking.clientId),
          artistsClient.getArtist(booking.artistId),
          catalogClient.getService(booking.serviceId)
        ]);

        const notificationData = {
          bookingId: id,
          bookingCode: booking.code || id.slice(0, 8),
          clientId: booking.clientId,
          clientName: user?.fullName || user?.firstName || 'Cliente',
          clientEmail: user?.email || '',
          artistId: booking.artistId,
          artistName: artist?.artistName || 'Artista',
          artistEmail: artist?.email || '',
          artistCategory: artist?.category || 'Categoría',
          artistImage: artist?.avatar || '',
          serviceName: service?.name || 'Servicio',
          scheduledDate: booking.scheduledDate.toISOString(),
          durationMinutes: booking.durationMinutes,
          location: booking.location || '',
          servicePrice: Number(booking.totalPrice),
          totalPrice: Number(booking.totalPrice),
          currency: booking.currency,
          depositRequired: booking.depositRequired,
          depositAmount: Number(booking.depositAmount),
        };

        await notifyBookingConfirmed(notificationData);
      } catch (err: any) {
        logger.error('Error enviando notificación de confirmación', 'BOOKING_SERVICE', { error: err.message });
      }
    })();

    // Activar conversación de chat
    chatClient.activateConversation(id, booking.clientId)
      .then(res => {
        if (res) {
          logger.info("Conversación de chat activada", "BOOKING_SERVICE", { bookingId: id });
        }
      })
      .catch(err => logger.error("Error activando conversación de chat", "BOOKING_SERVICE", { error: err.message }));

    return updated;
  }

  /**
   * Rechazar reserva (por el artista)
   */
  async rejectBooking(id: string, artistId: string, reason: string) {
    const booking = await this.getBookingById(id);

    if (booking.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para rechazar esta reserva");
    }

    if (booking.status !== "PENDING") {
      throw new AppError(400, "Solo se pueden rechazar reservas pendientes");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "REJECTED",
        cancelledAt: new Date(),
        cancelledBy: artistId,
        cancellationReason: reason,
      },
    });

    await this.recordStatusChange(
      id,
      booking.status,
      "REJECTED",
      artistId,
      reason
    );

    logger.info("Reserva rechazada", "BOOKING_SERVICE", {
      bookingId: id,
      artistId,
    });

    // Enviar notificación al cliente de rechazo
    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: 'BOOKING_REJECTED',
      channel: 'IN_APP',
      title: 'Reserva Rechazada',
      message: `Tu reserva ha sido rechazada: ${reason}`,
      data: {
        bookingId: id,
        scheduledDate: booking.scheduledDate.toISOString(),
        reason,
      },
      priority: 'high',
      category: 'booking',
    }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));

    return updated;
  }

  /**
   * Cancelar reserva
   */
  async cancelBooking(id: string, userId: string, reason: string) {
    const booking = await this.getBookingById(id);

    // Determinar quién cancela
    const isClient = booking.clientId === userId;
    const isArtist = booking.artistId === userId;

    if (!isClient && !isArtist) {
      throw new AppError(403, "No tienes permiso para cancelar esta reserva");
    }

    // No permitir cancelar si ya está cancelada o completada
    if (
      booking.status === "CANCELLED_CLIENT" ||
      booking.status === "CANCELLED_ARTIST" ||
      booking.status === "COMPLETED" ||
      booking.status === "REJECTED"
    ) {
      throw new AppError(400, "Esta reserva ya está cerrada");
    }

    // Calcular fee de cancelación si aplica
    const config = await this.getArtistConfig(booking.artistId);
    const hoursUntilBooking =
      (booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);

    let refundAmount = 0;
    if (booking.depositAmount && booking.depositPaidAt) {
      if (hoursUntilBooking >= config.cancellationHours) {
        // Reembolso completo
        refundAmount = booking.depositAmount;
      } else {
        // Aplicar fee de cancelación
        const feePercent = config.cancellationFee;
        refundAmount = Math.floor(
          booking.depositAmount * (1 - feePercent / 100)
        );
      }
    }

    const newStatus = isClient ? "CANCELLED_CLIENT" : "CANCELLED_ARTIST";

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason,
        refundAmount,
      },
    });

    await this.recordStatusChange(
      id,
      booking.status,
      newStatus,
      userId,
      reason
    );

    logger.info("Reserva cancelada", "BOOKING_SERVICE", {
      bookingId: id,
      userId,
      by: isClient ? "client" : "artist",
      refundAmount,
    });

    // Liberar el slot de disponibilidad del artista
    removeAvailabilityReservation(id)
      .catch(() => { /* puede no existir si nunca fue CONFIRMED */ });

    // Enviar notificaciones de cancelación
    if (isClient) {
      // Notificar al artista que el cliente canceló
      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: 'BOOKING_CANCELLED',
        channel: 'IN_APP',
        title: 'Reserva Cancelada',
        message: `El cliente ha cancelado una reserva: ${reason}`,
        data: {
          bookingId: id,
          scheduledDate: booking.scheduledDate.toISOString(),
          reason,
          refundAmount,
        },
        priority: 'high',
        category: 'booking',
      }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));
    } else {
      // Notificar al cliente que el artista canceló
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: 'BOOKING_CANCELLED',
        channel: 'IN_APP',
        title: 'Reserva Cancelada',
        message: `El artista ha cancelado tu reserva: ${reason}`,
        data: {
          bookingId: id,
          scheduledDate: booking.scheduledDate.toISOString(),
          reason,
          refundAmount,
        },
        priority: 'high',
        category: 'booking',
      }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));
    }

    return updated;
  }

  /**
   * Reprogramar reserva
   */
  async rescheduleBooking(
    id: string,
    userId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ) {
    const booking = await this.getBookingById(id);

    // Verificar permisos (solo cliente o artista)
    const isClient = booking.clientId === userId;
    const isArtist = booking.artistId === userId;

    if (!isClient && !isArtist) {
      throw new AppError(403, "No tienes permiso para reprogramar esta reserva");
    }

    // Verificar estado (solo PENDING, CONFIRMED, o RESCHEDULED pueden reprogramarse)
    if (!["PENDING", "CONFIRMED", "RESCHEDULED"].includes(booking.status)) {
      throw new AppError(400, "Esta reserva no puede ser reprogramada");
    }

    // Combinar fecha y hora
    const datePart = new Date(newDate);
    const [hours, minutes] = newTime.split(':').map(Number);
    const newScheduledDate = new Date(
      datePart.getFullYear(),
      datePart.getMonth(),
      datePart.getDate(),
      hours,
      minutes,
      0
    );

    // Validar que la nueva fecha sea futura
    if (newScheduledDate <= new Date()) {
      throw new AppError(400, "La nueva fecha debe ser en el futuro");
    }

    // Verificar límite de cambios (máximo 2 reprogramaciones)
    const rescheduleCount = booking.rescheduleCount || 0;
    if (rescheduleCount >= 2) {
      throw new AppError(400, "Has alcanzado el límite de reprogramaciones para esta reserva");
    }

    // Verificar ventana de cambio (no permitir <24h antes)
    const hoursUntilOriginalBooking =
      (booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilOriginalBooking < 24) {
      throw new AppError(
        400,
        "No puedes reprogramar con menos de 24 horas de anticipación"
      );
    }

    // Obtener configuración del artista
    const config = await this.getArtistConfig(booking.artistId);

    // Validar tiempo de anticipación mínimo
    const hoursUntilNewBooking =
      (newScheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilNewBooking < config.minAdvanceHours) {
      throw new AppError(
        400,
        `Debes reprogramar con al menos ${config.minAdvanceHours} horas de anticipación`
      );
    }

    // Verificar disponibilidad en la nueva fecha/hora
    const endTime = new Date(
      newScheduledDate.getTime() + booking.durationMinutes * 60 * 1000
    );
    const isAvailable = await this.checkAvailability(
      booking.artistId,
      newScheduledDate,
      endTime,
      id // Excluir el booking actual de la verificación
    );

    if (!isAvailable) {
      throw new AppError(409, "El nuevo horario no está disponible");
    }

    // Actualizar la reserva
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        scheduledDate: newScheduledDate,
        status: "RESCHEDULED",
        rescheduledAt: new Date(),
        rescheduledBy: userId,
        rescheduleReason: reason,
        rescheduleCount: rescheduleCount + 1,
      },
    });

    // Registrar cambio de estado
    await this.recordStatusChange(
      id,
      booking.status,
      "RESCHEDULED",
      userId,
      reason || "Reserva reprogramada"
    );

    logger.info("Reserva reprogramada", "BOOKING_SERVICE", {
      bookingId: id,
      userId,
      by: isClient ? "client" : "artist",
      originalDate: booking.scheduledDate.toISOString(),
      newDate: newScheduledDate.toISOString(),
      rescheduleCount: rescheduleCount + 1,
    });

    // Enviar notificaciones
    if (isClient) {
      // Notificar al artista
      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: "BOOKING_RESCHEDULED",
        channel: "IN_APP",
        title: "Reserva Reprogramada",
        message: `El cliente ha reprogramado una reserva para el ${newScheduledDate.toLocaleDateString()}`,
        data: {
          bookingId: id,
          originalDate: booking.scheduledDate.toISOString(),
          newDate: newScheduledDate.toISOString(),
          reason: reason || "",
        },
      });

      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: "BOOKING_RESCHEDULED",
        channel: "EMAIL",
        title: "Reserva Reprogramada",
        message: `El cliente ha reprogramado una reserva para el ${newScheduledDate.toLocaleDateString()} a las ${newTime}`,
        data: {
          bookingId: id,
          originalDate: booking.scheduledDate.toISOString(),
          newDate: newScheduledDate.toISOString(),
        },
      });
    } else {
      // Notificar al cliente
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: "BOOKING_RESCHEDULED",
        channel: "IN_APP",
        title: "Reserva Reprogramada",
        message: `Tu reserva ha sido reprogramada para el ${newScheduledDate.toLocaleDateString()}`,
        data: {
          bookingId: id,
          originalDate: booking.scheduledDate.toISOString(),
          newDate: newScheduledDate.toISOString(),
          reason: reason || "",
        },
      });

      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: "BOOKING_RESCHEDULED",
        channel: "EMAIL",
        title: "Reserva Reprogramada",
        message: `El artista ha reprogramado tu reserva para el ${newScheduledDate.toLocaleDateString()} a las ${newTime}`,
        data: {
          bookingId: id,
          originalDate: booking.scheduledDate.toISOString(),
          newDate: newScheduledDate.toISOString(),
        },
      });
    }

    return updated;
  }

  /**
   * Cambiar estado de reserva
   */
  async changeStatus(
    id: string,
    userId: string,
    newStatus: BookingStatus,
    reason?: string
  ) {
    const booking = await this.getBookingById(id);

    // Verificar permisos (solo el artista puede cambiar ciertos estados)
    if (
      newStatus === "IN_PROGRESS" ||
      newStatus === "COMPLETED" ||
      newStatus === "NO_SHOW"
    ) {
      if (booking.artistId !== userId) {
        throw new AppError(403, "Solo el artista puede cambiar a este estado");
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.recordStatusChange(
      id,
      booking.status,
      newStatus,
      userId,
      reason
    );

    logger.info("Estado de reserva cambiado", "BOOKING_SERVICE", {
      bookingId: id,
      from: booking.status,
      to: newStatus,
    });

    return updated;
  }

  /**
   * Marcar pago
   */
  async markPayment(
    id: string,
    amount: number,
    paymentMethod?: string,
    paymentIntentId?: string,
    paymentType?: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING'
  ) {
    const booking = await this.getBookingById(id);

    const newPaidAmount = booking.paidAmount + amount;
    let newPaymentStatus: PaymentStatus = "PENDING";

    // Determinar el nuevo status de pago basado en el tipo de pago
    if (paymentType === 'DEPOSIT') {
      newPaymentStatus = "DEPOSIT_PAID";
    } else if (paymentType === 'FULL_PAYMENT' || newPaidAmount >= booking.totalPrice) {
      newPaymentStatus = "FULLY_PAID";
    } else if (booking.depositRequired && booking.depositAmount) {
      if (newPaidAmount >= booking.totalPrice) {
        newPaymentStatus = "FULLY_PAID";
      } else if (newPaidAmount >= booking.depositAmount) {
        newPaymentStatus = "DEPOSIT_PAID";
      }
    } else {
      if (newPaidAmount >= booking.totalPrice) {
        newPaymentStatus = "FULLY_PAID";
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        paymentMethod: paymentMethod || booking.paymentMethod,
        paymentIntentId: paymentIntentId || booking.paymentIntentId,
        paidAt: newPaymentStatus === "FULLY_PAID" ? new Date() : booking.paidAt,
        depositPaidAt:
          newPaymentStatus === "DEPOSIT_PAID" && !booking.depositPaidAt
            ? new Date()
            : booking.depositPaidAt,
      },
    });

    logger.info("Pago registrado", "BOOKING_SERVICE", {
      bookingId: id,
      amount,
      newTotal: newPaidAmount,
      paymentStatus: newPaymentStatus,
      paymentType,
      paymentIntentId,
    });

    return updated;
  }

  // ==================== DISPONIBILIDAD ====================

  /**
   * Verificar disponibilidad de un artista
   */
  async checkAvailability(
    artistId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    // Verificar slots bloqueados
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        artistId,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (blockedSlots.length > 0) {
      return false;
    }

    // Verificar reservas existentes
    const where: any = {
      artistId,
      status: {
        in: ["PENDING", "CONFIRMED", "PAYMENT_PENDING", "PAYMENT_COMPLETED"],
      },
      OR: [
        {
          AND: [
            { scheduledDate: { lte: startTime } },
            {
              scheduledDate: {
                gt: startTime,
              },
            },
          ],
        },
        {
          scheduledDate: {
            gte: startTime,
            lt: endTime,
          },
        },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const conflictingBookings = await prisma.booking.findMany({ where });

    // Verificar si hay conflictos considerando duración
    for (const booking of conflictingBookings) {
      const bookingEnd = new Date(
        booking.scheduledDate.getTime() + booking.durationMinutes * 60 * 1000
      );

      // Hay conflicto si:
      // 1. El inicio está dentro de otro booking
      // 2. El fin está dentro de otro booking
      // 3. El booking cubre completamente a otro
      if (
        (startTime >= booking.scheduledDate && startTime < bookingEnd) ||
        (endTime > booking.scheduledDate && endTime <= bookingEnd) ||
        (startTime <= booking.scheduledDate && endTime >= bookingEnd)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtener slots disponibles para un artista
   */
  async getAvailableSlots(
    artistId: string,
    startDate: Date,
    endDate: Date,
    durationMinutes: number
  ) {
    const config = await this.getArtistConfig(artistId);

    // TODO: Obtener disponibilidad semanal del artista desde artists-service
    // Por ahora asumimos horario 9am-6pm todos los días laborales

    const slots: { start: Date; end: Date }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Solo días laborales (lunes a viernes)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // 9am a 6pm
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Verificar si el slot completo está dentro del horario laboral
          if (slotEnd.getHours() <= 18) {
            const isAvailable = await this.checkAvailability(
              artistId,
              slotStart,
              slotEnd
            );

            if (isAvailable) {
              slots.push({ start: slotStart, end: slotEnd });
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  // ==================== SLOTS BLOQUEADOS ====================

  /**
   * Bloquear slot de tiempo
   */
  async blockSlot(data: {
    artistId: string;
    startTime: Date;
    endTime: Date;
    reason?: string;
    isRecurring?: boolean;
  }) {
    const slot = await prisma.blockedSlot.create({
      data: {
        artistId: data.artistId,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        isRecurring: data.isRecurring || false,
      },
    });

    logger.info("Slot bloqueado", "BOOKING_SERVICE", {
      slotId: slot.id,
      artistId: data.artistId,
    });

    return slot;
  }

  /**
   * Obtener slots bloqueados de un artista
   */
  async getBlockedSlots(artistId: string, startDate?: Date, endDate?: Date) {
    const where: any = { artistId };

    if (startDate || endDate) {
      where.OR = [
        {
          AND: [
            { startTime: { lte: startDate } },
            { endTime: { gt: startDate } },
          ],
        },
        {
          AND: [{ startTime: { lt: endDate } }, { endTime: { gte: endDate } }],
        },
        {
          AND: [
            { startTime: { gte: startDate } },
            { endTime: { lte: endDate } },
          ],
        },
      ];
    }

    return await prisma.blockedSlot.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
  }

  /**
   * Eliminar slot bloqueado
   */
  async unblockSlot(id: string, artistId: string) {
    const slot = await prisma.blockedSlot.findUnique({ where: { id } });

    if (!slot) {
      throw new AppError(404, "Slot no encontrado");
    }

    if (slot.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para desbloquear este slot");
    }

    await prisma.blockedSlot.delete({ where: { id } });

    logger.info("Slot desbloqueado", "BOOKING_SERVICE", { slotId: id });
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Obtener o crear configuración de disponibilidad
   */
  async getArtistConfig(artistId: string) {
    let config = await prisma.availabilityConfig.findUnique({
      where: { artistId },
    });

    if (!config) {
      // Crear configuración por defecto
      config = await prisma.availabilityConfig.create({
        data: {
          artistId,
          minAdvanceHours: 24,
          maxAdvanceDays: 90,
          bufferMinutes: 30,
          autoConfirm: false,
          requiresDeposit: true,
          cancellationHours: 48,
          cancellationFee: 50,
        },
      });
    }

    return config;
  }

  /**
   * Actualizar configuración de disponibilidad
   */
  async updateArtistConfig(artistId: string, data: any) {
    const config = await prisma.availabilityConfig.upsert({
      where: { artistId },
      update: data,
      create: {
        artistId,
        ...data,
      },
    });

    logger.info("Configuración actualizada", "BOOKING_SERVICE", { artistId });

    return config;
  }

  // ==================== UTILIDADES ====================

  /**
   * Registrar cambio de estado en el historial
   */
  private async recordStatusChange(
    bookingId: string,
    fromStatus: BookingStatus | null,
    toStatus: BookingStatus,
    changedBy: string,
    reason?: string
  ) {
    await prisma.bookingStatusChange.create({
      data: {
        bookingId,
        fromStatus,
        toStatus,
        changedBy,
        reason,
      },
    });
  }

  /**
   * Obtener estadísticas de reservas
   */
  async getBookingStats(artistId?: string, clientId?: string) {
    const where: any = {};
    if (artistId) where.artistId = artistId;
    if (clientId) where.clientId = clientId;

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      totalRevenue,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: "PENDING" } }),
      prisma.booking.count({ where: { ...where, status: "CONFIRMED" } }),
      prisma.booking.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.booking.count({
        where: {
          ...where,
          status: { in: ["CANCELLED_CLIENT", "CANCELLED_ARTIST"] },
        },
      }),
      prisma.booking.aggregate({
        where: { ...where, paymentStatus: "FULLY_PAID" },
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
  }

  // ...existing code...

  /**
   * Obtiene estadísticas globales para el admin
   */
  async getAdminStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      stats,
      revenueThisMonth,
      bookingsThisMonth,
      bookingsByMonth
    ] = await Promise.all([
      this.getBookingStats(),
      prisma.booking.aggregate({
        where: {
          paymentStatus: "FULLY_PAID",
          paidAt: { gte: startOfMonth }
        },
        _sum: { totalPrice: true }
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.getBookingsByMonth(6)
    ]);

    return {
      ...stats,
      revenueThisMonth: revenueThisMonth._sum.totalPrice || 0,
      bookingsThisMonth,
      bookingsByMonth
    };
  }

  /**
   * Obtiene conteo de bookings por mes
   */
  private async getBookingsByMonth(monthsCount: number) {
    const result = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const count = await prisma.booking.count({
        where: {
          createdAt: {
            gte: d,
            lt: nextD
          }
        }
      });
      
      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      result.push({ month: monthName, count });
    }
    
    return result;
  }

  /**
   * Búsqueda avanzada para admin
   */
  async adminSearchBookings(filters: {
    search?: string;
    status?: BookingStatus;
    page: number;
    limit: number;
  }) {
    const { search, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { clientId: { contains: search, mode: 'insensitive' } },
        { artistId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.booking.count({ where })
    ]);

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Calcula la distancia entre dos puntos (Haversine formula)
   */
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getUserStats(userId: string) {
    const total = await prisma.booking.count({
      where: { clientId: userId, deletedAt: null }
    });
    return { total };
  }

  async getBatchStats(artistIds: string[]) {
    const stats = await prisma.booking.groupBy({
      by: ['artistId'],
      where: { artistId: { in: artistIds }, deletedAt: null },
      _count: { id: true }
    });
    
    return stats.reduce((acc: any, s: any) => {
      acc[s.artistId] = { total: s._count.id };
      return acc;
    }, {});
  }

  /**
   * Devuelve los IDs de artistas que tienen reservas PENDIENTES o CONFIRMADAS
   * en una fecha concreta (día completo, zona UTC).
   */
  async getArtistsBusyOnDate(date: Date): Promise<string[]> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        scheduledDate: { gte: start, lte: end },
        status: { in: ['PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'] },
        deletedAt: null,
      },
      select: { artistId: true },
    });

    // IDs únicos de artistas ocupados
    return [...new Set(bookings.map((b) => b.artistId))];
  }

  // ==================== SOLICITUDES DE CAMBIO DE FECHA ====================

  /**
   * Cliente solicita cambio de fecha.
   * Crea un RescheduleRequest PENDING_ARTIST y notifica al artista.
   */
  async createRescheduleRequest(
    bookingId: string,
    clientId: string,
    proposedDate: Date,
    reason?: string
  ) {
    const booking = await this.getBookingById(bookingId);

    if (booking.clientId !== clientId) {
      throw new AppError(403, "No tienes permiso para solicitar cambio de fecha en esta reserva");
    }

    if (!["PENDING", "CONFIRMED", "PAYMENT_PENDING", "PAYMENT_COMPLETED"].includes(booking.status)) {
      throw new AppError(400, "Solo puedes solicitar cambio de fecha en reservas activas");
    }

    if (proposedDate <= new Date()) {
      throw new AppError(400, "La fecha propuesta debe ser en el futuro");
    }

    const hoursUntilBooking = (booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24) {
      throw new AppError(400, "No puedes solicitar cambio de fecha con menos de 24 horas de anticipación");
    }

    const rescheduleCount = booking.rescheduleCount || 0;
    if (rescheduleCount >= 2) {
      throw new AppError(400, "Has alcanzado el límite de cambios de fecha para esta reserva");
    }

    // Cancel any existing pending request for this booking
    await prisma.rescheduleRequest.updateMany({
      where: {
        bookingId,
        status: { in: ["PENDING_ARTIST", "PENDING_CLIENT"] },
      },
      data: { status: "EXPIRED" },
    });

    const request = await prisma.rescheduleRequest.create({
      data: {
        bookingId,
        requestedBy: clientId,
        proposedDate,
        reason,
        status: "PENDING_ARTIST",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "RESCHEDULE_PENDING_ARTIST" },
    });

    await this.recordStatusChange(bookingId, booking.status as BookingStatus, "RESCHEDULE_PENDING_ARTIST", clientId, reason || "Solicitud de cambio de fecha");

    // Notify artist IN_APP
    notificationsClient.sendNotification({
      userId: booking.artistId,
      type: "RESCHEDULE_REQUESTED",
      channel: "IN_APP",
      title: "Solicitud de cambio de fecha",
      message: `El cliente solicita cambiar la fecha de la reserva ${booking.code || bookingId.slice(0, 8)} al ${proposedDate.toLocaleDateString("es-GT")}`,
      data: { bookingId, rescheduleRequestId: request.id, proposedDate: proposedDate.toISOString(), reason },
      priority: "high",
      category: "booking",
    }).catch(() => null);

    return request;
  }

  /**
   * Artista acepta o rechaza la solicitud de cambio de fecha.
   * Si acepta: genera token de confirmación y lo envía al cliente por email.
   * Si rechaza: cierra la solicitud y restaura el estado original del booking.
   */
  async respondToReschedule(
    requestId: string,
    artistId: string,
    accept: boolean,
    rejectionReason?: string
  ) {
    const request = await prisma.rescheduleRequest.findUnique({
      where: { id: requestId },
      include: { booking: true },
    });

    if (!request) {
      throw new AppError(404, "Solicitud de cambio de fecha no encontrada");
    }

    if (request.booking.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para responder esta solicitud");
    }

    if (request.status !== "PENDING_ARTIST") {
      throw new AppError(400, "Esta solicitud ya fue respondida");
    }

    if (!accept) {
      // Reject: restore booking to original status
      const previousStatus = request.booking.status === "RESCHEDULE_PENDING_ARTIST"
        ? "CONFIRMED"
        : request.booking.status;

      await prisma.rescheduleRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          artistRespondedAt: new Date(),
          artistRejectionReason: rejectionReason,
        },
      });

      await prisma.booking.update({
        where: { id: request.bookingId },
        data: { status: previousStatus as BookingStatus },
      });

      await this.recordStatusChange(
        request.bookingId,
        "RESCHEDULE_PENDING_ARTIST",
        previousStatus as BookingStatus,
        artistId,
        rejectionReason || "Artista rechazó el cambio de fecha"
      );

      notificationsClient.sendNotification({
        userId: request.booking.clientId,
        type: "RESCHEDULE_REJECTED",
        channel: "IN_APP",
        title: "Cambio de fecha rechazado",
        message: `El artista no puede atenderte en la fecha propuesta.${rejectionReason ? ` Motivo: ${rejectionReason}` : ""}`,
        data: { bookingId: request.bookingId, rescheduleRequestId: requestId, reason: rejectionReason },
        priority: "high",
        category: "booking",
      }).catch(() => null);

      return { accepted: false, request };
    }

    // Accept: generate confirmation token valid 24h
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await prisma.rescheduleRequest.update({
      where: { id: requestId },
      data: {
        status: "PENDING_CLIENT",
        artistRespondedAt: new Date(),
        confirmationToken: token,
        tokenExpiresAt,
      },
    });

    await prisma.booking.update({
      where: { id: request.bookingId },
      data: { status: "RESCHEDULE_PENDING_CLIENT" },
    });

    await this.recordStatusChange(
      request.bookingId,
      "RESCHEDULE_PENDING_ARTIST",
      "RESCHEDULE_PENDING_CLIENT",
      artistId,
      "Artista aceptó el cambio de fecha, esperando confirmación del cliente"
    );

    // Build confirmation URL
    const clientBaseUrl = process.env.CLIENT_APP_URL || "http://localhost:3000";
    const confirmUrl = `${clientBaseUrl}/booking/reschedule/confirm?token=${token}`;

    notificationsClient.sendNotification({
      userId: request.booking.clientId,
      type: "RESCHEDULE_ACCEPTED",
      channel: "IN_APP",
      title: "Artista aceptó el cambio de fecha",
      message: `El artista aceptó tu solicitud. Confirma el cambio antes de ${tokenExpiresAt.toLocaleDateString("es-GT")}.`,
      data: { bookingId: request.bookingId, rescheduleRequestId: requestId, confirmUrl, proposedDate: request.proposedDate.toISOString() },
      priority: "urgent",
      category: "booking",
    }).catch(() => null);

    // Email with confirmation link
    notificationsClient.sendNotification({
      userId: request.booking.clientId,
      type: "RESCHEDULE_ACCEPTED",
      channel: "EMAIL",
      title: "Confirma el cambio de fecha de tu reserva",
      message: `El artista aceptó tu solicitud de cambio de fecha. Haz clic en el enlace para confirmar.`,
      data: { bookingId: request.bookingId, confirmUrl },
      priority: "urgent",
      category: "booking",
      emailSubject: "Confirma el cambio de fecha de tu reserva",
      emailHtml: `
        <h2>El artista aceptó tu cambio de fecha</h2>
        <p>Tu solicitud para cambiar la reserva <strong>${request.booking.code || request.bookingId.slice(0, 8)}</strong> al <strong>${request.proposedDate.toLocaleDateString("es-GT")}</strong> fue aceptada.</p>
        <p>Tienes <strong>24 horas</strong> para confirmar el cambio haciendo clic en el siguiente enlace:</p>
        <p><a href="${confirmUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Confirmar cambio de fecha</a></p>
        <p style="color:#666;font-size:14px;">Este enlace expira el ${tokenExpiresAt.toLocaleString("es-GT")}. Si no confirmas, la solicitud se cancelará automáticamente.</p>
      `,
    }).catch(() => null);

    return { accepted: true, request: updated, confirmUrl };
  }

  /**
   * Cliente confirma el cambio de fecha a través del token recibido por email.
   * Aplica la nueva fecha al booking y actualiza el estado a RESCHEDULED.
   */
  async confirmRescheduleByToken(token: string) {
    const request = await prisma.rescheduleRequest.findUnique({
      where: { confirmationToken: token },
      include: { booking: true },
    });

    if (!request) {
      throw new AppError(404, "Enlace de confirmación inválido");
    }

    if (request.status !== "PENDING_CLIENT") {
      if (request.status === "CONFIRMED") {
        throw new AppError(400, "Este cambio de fecha ya fue confirmado");
      }
      throw new AppError(400, "Este enlace ya no es válido");
    }

    if (request.tokenExpiresAt && request.tokenExpiresAt < new Date()) {
      await prisma.rescheduleRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError(410, "El enlace de confirmación ha expirado. Por favor solicita un nuevo cambio de fecha.");
    }

    // Apply the new date and mark as rescheduled
    await prisma.rescheduleRequest.update({
      where: { id: request.id },
      data: { status: "CONFIRMED", clientConfirmedAt: new Date(), confirmationToken: null },
    });

    const updatedBooking = await prisma.booking.update({
      where: { id: request.bookingId },
      data: {
        scheduledDate: request.proposedDate,
        status: "RESCHEDULED",
        rescheduledAt: new Date(),
        rescheduledBy: request.requestedBy,
        rescheduleReason: request.reason,
        rescheduleCount: { increment: 1 },
      },
    });

    await this.recordStatusChange(
      request.bookingId,
      "RESCHEDULE_PENDING_CLIENT",
      "RESCHEDULED",
      request.requestedBy,
      "Cliente confirmó el cambio de fecha"
    );

    // Update availability reservation
    removeAvailabilityReservation(request.bookingId).catch(() => null);
    const endAt = new Date(request.proposedDate);
    endAt.setMinutes(endAt.getMinutes() + request.booking.durationMinutes);
    createAvailabilityReservation({
      artistId: request.booking.artistId,
      bookingId: request.bookingId,
      startAt: request.proposedDate,
      endAt,
    }).catch(() => null);

    // Notify artist
    notificationsClient.sendNotification({
      userId: request.booking.artistId,
      type: "RESCHEDULE_CONFIRMED",
      channel: "IN_APP",
      title: "Cambio de fecha confirmado",
      message: `El cliente confirmó el cambio de fecha para la reserva ${request.booking.code || request.bookingId.slice(0, 8)} al ${request.proposedDate.toLocaleDateString("es-GT")}.`,
      data: { bookingId: request.bookingId, newDate: request.proposedDate.toISOString() },
      priority: "high",
      category: "booking",
    }).catch(() => null);

    return { booking: updatedBooking, request };
  }

  /**
   * Lista las solicitudes de cambio de fecha de una reserva.
   * Solo el cliente o el artista pueden verlas.
   */
  async listRescheduleRequests(bookingId: string, userId: string) {
    const booking = await this.getBookingById(bookingId);

    if (booking.clientId !== userId && booking.artistId !== userId) {
      throw new AppError(403, "No tienes permiso para ver estas solicitudes");
    }

    return prisma.rescheduleRequest.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const bookingService = new BookingService();
