import prisma from "../lib/prisma";
import { BookingStatus, PaymentStatus, RescheduleStatus } from "../types/prisma-enums";
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
import { notifyBookingCreated, notifyBookingConfirmed, notifyNoShowReported, notifyNoShowResolved } from "../utils/notifications";
import { createAvailabilityReservation, removeAvailabilityReservation, checkReservationConflict } from "./availability.service";
import { googleCalendarClient } from "../clients/google-calendar.client";
import { createReplacementPrompt } from "./replacement.service";

const CITY_COORDS: Record<string, [number, number]> = {
  'Guatemala':           [14.6349, -90.5069],
  'Ciudad de Guatemala': [14.6349, -90.5069],
  'Antigua Guatemala':   [14.5586, -90.7295],
  'Antigua':             [14.5586, -90.7295],
  'Quetzaltenango':      [14.8444, -91.5174],
  'Xela':                [14.8444, -91.5174],
  'Cobán':               [15.4667, -90.3667],
  'Escuintla':           [14.3050, -90.7850],
  'Flores':              [16.9333, -89.8833],
  'Huehuetenango':       [15.3167, -91.4667],
  'Puerto Barrios':      [15.7167, -88.6000],
  'Mazatenango':         [14.5333, -91.5000],
  'Jalapa':              [14.6333, -89.9833],
  'Chiquimula':          [14.7958, -89.5458],
  'Zacapa':              [14.9667, -89.5333],
  'Retalhuleu':          [14.5333, -91.6833],
};

export class BookingService {
  private generateAttendanceCode(): string {
    return String(crypto.randomInt(100000, 999999));
  }

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
    eventType?: string;
    clientNotes?: string;
    dressCode?: string;
    eventId?: string;
    couponCode?: string;
    sonidistaServiceId?: string;
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
    let sameDayBookingApplied = false;

    // Coordenadas del artista: usar explícitas o fallback por ciudad
    let artistLat = artist?.baseLocationLat;
    let artistLng = artist?.baseLocationLng;
    if ((!artistLat || !artistLng) && artist?.city) {
      const cityCoords = CITY_COORDS[artist.city];
      if (cityCoords) {
        [artistLat, artistLng] = cityCoords;
        logger.info(`Usando coordenadas de ciudad como fallback para artista`, "BOOKING_SERVICE", { city: artist.city, artistId: data.artistId });
      }
    }

    if (!artistLat || !artistLng) {
      logger.warn(`Artista sin coordenadas base ni ciudad reconocida — viáticos no aplicarán`, "BOOKING_SERVICE", { artistId: data.artistId });
    } else if (!data.locationLat || !data.locationLng) {
      logger.warn(`Cliente sin coordenadas — viáticos no aplicarán aunque haya distancia`, "BOOKING_SERVICE", { clientId: data.clientId });
    }
    if (artistLat && artistLng && data.locationLat && data.locationLng) {
      distanceKm = this.getDistance(
        artistLat,
        artistLng,
        data.locationLat,
        data.locationLng
      );
      logger.info(`Distancia calculada para reserva: ${distanceKm.toFixed(2)} km`, "BOOKING_SERVICE");

      // Regla 60km: si artista y cliente están a ≤60km y allowSameDayBooking=true → minAdvanceHours=3
      if (distanceKm <= 60 && artist?.allowSameDayBooking !== false) {
        config.minAdvanceHours = 3;
        sameDayBookingApplied = true;
        logger.info(`Regla 60km aplicada: minAdvanceHours=3`, "BOOKING_SERVICE", { distanceKm });
      }
    }

    // Re-validar tiempo de anticipación con minAdvanceHours posiblemente actualizado
    if (hoursUntilBooking < config.minAdvanceHours) {
      throw new AppError(
        400,
        sameDayBookingApplied
          ? `Para reservas el mismo día debes reservar con al menos ${config.minAdvanceHours} horas de anticipación`
          : `Debes reservar con al menos ${config.minAdvanceHours} horas de anticipación`
      );
    }

    // Obtener precio del servicio desde catalog-service (y metadatos del servicio en paralelo)
    const [priceQuote, serviceDetails] = await Promise.all([
      catalogClient.calculatePrice({
        serviceId: data.serviceId,
        durationMinutes: data.durationMinutes,
        selectedAddonIds: data.selectedAddons || [],
        distanceKm,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
      }),
      catalogClient.getService(data.serviceId),
    ]);

    if (!priceQuote) {
      throw new AppError(500, "No se pudo calcular el precio del servicio");
    }

    const servicePrice = priceQuote.breakdown.baseCents;
    const addonsPrice = priceQuote.breakdown.addonsCents;
    const travelPrice = priceQuote.breakdown.travelCents;
    const dayOfferDiscountAmount = priceQuote.breakdown.discountsCents ?? 0;
    let totalPrice = priceQuote.totalCents;

    // Validate coupon before creating booking (use placeholder bookingId='')
    let couponDiscountAmount = 0;
    let validatedCouponId: string | null = null;
    if (data.couponCode) {
      try {
        const couponResult = await paymentsClient.validateCoupon({
          code: data.couponCode,
          userId: data.clientId,
          bookingId: '',
          bookingTotal: totalPrice,
          artistId: data.artistId,
          serviceId: data.serviceId,
        });
        if (couponResult && couponResult.valid) {
          couponDiscountAmount = couponResult.discount;
          validatedCouponId = couponResult.couponId || null;
          totalPrice = Math.max(0, totalPrice - couponDiscountAmount);
          logger.info('Cupón aplicado al booking', 'BOOKING_SERVICE', {
            code: data.couponCode,
            discount: couponDiscountAmount,
            newTotal: totalPrice,
          });
        } else {
          logger.warn('Cupón inválido — se procede sin descuento', 'BOOKING_SERVICE', {
            code: data.couponCode,
            error: couponResult?.error,
          });
        }
      } catch (err: any) {
        logger.warn('Error validando cupón — se procede sin descuento', 'BOOKING_SERVICE', { error: err.message });
      }
    }

    // Calcular depósito si es requerido
    const depositRequired = config.requiresDeposit;
    const depositAmount = priceQuote.depositRequiredCents || (depositRequired ? Math.floor(totalPrice * 0.5) : 0);

    // Copiar del servicio si aplica entrega de producto (fotógrafos, videógrafos, etc.)
    const requiresProductDelivery = serviceDetails?.requiresProductDelivery ?? false;

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
        clientLat: data.locationLat,
        clientLng: data.locationLng,
        distanceKm: distanceKm || null,
        status: initialStatus,
        servicePrice,
        addonsPrice,
        travelPrice,
        totalPrice,
        quoteSnapshot: priceQuote as any, // Guardar quote completo
        anticipoRequired: depositRequired,
        anticipoAmount: depositAmount,
        selectedAddons: data.selectedAddons || [],
        eventType: data.eventType as any || null,
        clientNotes: data.clientNotes,
        dressCode: data.dressCode,
        paymentStatus: depositRequired ? "PENDING" : "ANTICIPO_PAID",
        eventId: data.eventId || null,
        couponCode: data.couponCode || null,
        couponDiscountAmount,
        dayOfferDiscountAmount,
        requiresProductDelivery,
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

    // Add coupon discount item if applicable
    if (couponDiscountAmount > 0 && data.couponCode) {
      await prisma.bookingItem.create({
        data: {
          bookingId: booking.id,
          type: 'DISCOUNT',
          name: `Descuento cupón: ${data.couponCode}`,
          qty: 1,
          unitPriceCents: -couponDiscountAmount,
          totalPriceCents: -couponDiscountAmount,
          metadata: { couponCode: data.couponCode },
        },
      });

      // Redeem the coupon synchronously — the booking exists with the discount applied,
      // so failing silently here would allow the coupon to be reused without being consumed.
      if (validatedCouponId) {
        try {
          await paymentsClient.redeemCoupon({
            couponId: validatedCouponId,
            userId: data.clientId,
            bookingId: booking.id,
            discountApplied: couponDiscountAmount,
          });
        } catch (err: any) {
          logger.error(
            'Error redimiendo cupón — descuento aplicado pero cupón no marcado como usado, requiere revisión manual',
            'BOOKING_SERVICE',
            { couponCode: data.couponCode, couponId: validatedCouponId, bookingId: booking.id, error: err.message }
          );
          // No lanzar excepción: la reserva es válida y el pago puede proceder.
          // Registrar para reconciliación manual.
        }
      }
    }

    // Si se requiere depósito, crear Payment Intent
    let paymentIntent = null;
    if (depositRequired && depositAmount > 0) {
      const paymentIntentResponse = await paymentsClient.createPaymentIntent({
        bookingId: booking.id,
        amount: depositAmount,
        currency: 'USD',
        paymentType: 'DEPOSIT',
        userId: data.clientId,
      });

      if (paymentIntentResponse) {
        paymentIntent = paymentIntentResponse.paymentIntent;
        
        // Actualizar booking con el paymentIntentId
        await prisma.booking.update({
          where: { id: booking.id },
          data: { providerPaymentId: paymentIntent.id },
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

    // Si no se requiere anticipo, enviar email + push de inmediato (ya se puede confirmar)
    if (!depositRequired) {
      ;(async () => {
        try {
          const [user, artist, service] = await Promise.all([
            usersClient.getUser(data.clientId),
            artistsClient.getArtist(data.artistId),
            catalogClient.getService(data.serviceId),
          ]);
          const clientName = (user as any)?.fullName || (user as any)?.nombre || 'Cliente';
          const serviceName = (service as any)?.name || 'Servicio';
          const bookingDate = new Date(booking.scheduledDate).toLocaleDateString('es-GT', {
            day: 'numeric', month: 'long',
          });

          await notifyBookingCreated({
            bookingId: booking.id,
            bookingCode: booking.code || booking.id.slice(0, 8).toUpperCase(),
            clientId: booking.clientId,
            clientName,
            clientEmail: (user as any)?.email || '',
            clientNotes: booking.clientNotes || '',
            artistId: booking.artistId,
            artistName: (artist as any)?.artistName || (artist as any)?.nombre || 'Artista',
            artistEmail: (artist as any)?.email || '',
            artistCategory: (artist as any)?.category || '',
            artistImage: (artist as any)?.avatar || '',
            serviceName,
            scheduledDate: booking.scheduledDate.toISOString(),
            durationMinutes: booking.durationMinutes,
            location: booking.location || '',
            servicePrice: Number(booking.totalPrice),
            totalPrice: Number(booking.totalPrice),
            currency: booking.currency,
            anticipoRequired: false,
            anticipoAmount: 0,
            eventType: booking.eventType || undefined,
          });

          // Push + IN_APP al artista para que confirme
          const pushMsg = `${clientName} reservó "${serviceName}" para el ${bookingDate}. Confírmala en tu app.`;
          notificationsClient.sendNotification({
            userId: booking.artistId,
            type: 'NEW_BOOKING',
            channel: 'IN_APP',
            title: 'Nueva solicitud de reserva',
            message: pushMsg,
            data: { bookingId: booking.id, bookingCode: booking.code || '' },
            priority: 'high',
            category: 'booking',
          }).catch(() => {});
          notificationsClient.sendNotification({
            userId: booking.artistId,
            type: 'NEW_BOOKING',
            channel: 'PUSH',
            title: 'Nueva solicitud de reserva',
            message: pushMsg,
            data: { bookingId: booking.id, bookingCode: booking.code || '' },
            priority: 'high',
            category: 'booking',
          }).catch(() => {});
        } catch (err: any) {
          logger.error('Error enviando notificación de reserva sin anticipo', 'BOOKING_SERVICE', { error: err.message });
        }
      })();
    }

    // Crear conversación solo si se auto-confirma (sin intervención del artista)
    if (initialStatus === "CONFIRMED") {
      chatClient.createConversation(data.clientId, data.artistId, booking.id)
        .then(conv => {
          if (conv) logger.info("Conversación creada (auto-confirm)", "BOOKING_SERVICE", { bookingId: booking.id });
        })
        .catch(err => logger.error("Error creando conversación de chat", "BOOKING_SERVICE", { error: err.message }));
    }

    // ── Sonidista addon ─────────────────────────────────────────────────────
    let sonidistaBooking: any = null;
    if (data.sonidistaServiceId) {
      try {
        const sonidistaService = await catalogClient.getService(data.sonidistaServiceId);
        if (sonidistaService && sonidistaService.artistId) {
          const endAt = new Date(scheduledDate.getTime() + data.durationMinutes * 60_000);
          const { hasReservation } = await checkReservationConflict(
            sonidistaService.artistId, scheduledDate, endAt
          );
          if (!hasReservation) {
            const sonidistaCode = await generateBookingCode();
            const [createdSonidistaBooking] = await prisma.$transaction([
              prisma.booking.create({
                data: {
                  code: sonidistaCode,
                  clientId: data.clientId,
                  artistId: sonidistaService.artistId,
                  serviceId: data.sonidistaServiceId,
                  scheduledDate,
                  durationMinutes: data.durationMinutes,
                  location: data.location,
                  locationLat: data.locationLat,
                  locationLng: data.locationLng,
                  eventType: data.eventType as any,
                  clientNotes: `Reserva vinculada a ${booking.code}`,
                  basePrice: sonidistaService.basePrice ?? 0,
                  totalPrice: sonidistaService.basePrice ?? 0,
                  currency: sonidistaService.currency ?? 'GTQ',
                  status: BookingStatus.PENDING,
                  paymentStatus: PaymentStatus.PENDING,
                  linkedBookingId: booking.id,
                  bookingRole: 'SONIDISTA_ADDON',
                },
              }),
              prisma.booking.update({
                where: { id: booking.id },
                data: { linkedBookingId: undefined, bookingRole: 'PRIMARY' },
              }),
            ]);
            await prisma.booking.update({
              where: { id: booking.id },
              data: { linkedBookingId: createdSonidistaBooking.id, bookingRole: 'PRIMARY' },
            });
            sonidistaBooking = createdSonidistaBooking;
            notifyBookingCreated(createdSonidistaBooking as any, sonidistaService.artistId, data.clientId)
              .catch((err: any) => logger.warn('Error notificando sonidista', 'BOOKING_SERVICE', { error: err.message }));
            notificationsClient.sendNotification({
              userId: data.clientId,
              type: 'BOOKING_UPDATE',
              channel: 'IN_APP',
              title: 'Solicitud enviada al sonidista',
              message: `${sonidistaService.artistName ?? 'El sonidista'} recibió tu solicitud. Te avisaremos cuando confirme.`,
              data: { bookingId: createdSonidistaBooking.id },
            }).catch(() => {});
          } else {
            logger.warn('Sonidista no disponible para la fecha solicitada', 'BOOKING_SERVICE', {
              sonidistaArtistId: sonidistaService.artistId,
            });
          }
        }
      } catch (err: any) {
        logger.error('Error creando reserva de sonidista', 'BOOKING_SERVICE', { error: err.message });
        // No propagar — la reserva principal ya se creó
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    return {
      booking,
      sonidistaBooking,
      paymentIntent: paymentIntent ? {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      } : null,
      sameDayBookingApplied,
      minAdvanceHours: config.minAdvanceHours,
    };
  }

  /**
   * Obtener reserva por ID
   */
  async getBookingById(id: string) {
    let booking = await prisma.booking.findUnique({
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

    // Lazy-generation para reservas confirmadas antes de que existiera el código de asistencia
    if (
      (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') &&
      !(booking as any).attendanceCode
    ) {
      booking = await (prisma as any).booking.update({
        where: { id },
        data: { attendanceCode: this.generateAttendanceCode() },
        include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });
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
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const SORTABLE_FIELDS = ['scheduledDate', 'createdAt', 'updatedAt', 'totalPrice', 'status'];
    const sortField = SORTABLE_FIELDS.includes(filters.sortBy || '') ? filters.sortBy! : 'scheduledDate';
    const sortOrder = filters.sortOrder || 'asc';

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
        orderBy: { [sortField]: sortOrder } as any,
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
      dressCode?: string;
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
        dressCode: data.dressCode,
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
        attendanceCode: this.generateAttendanceCode(),
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

    // Doble condición para el cobro: artista confirmó + 48h desde la creación vencidas.
    // El captureScheduledAt fue fijado en markCardAuthorized() = createdAt + 48h.
    if (booking.paymentStatus === 'CARD_AUTHORIZED') {
      const captureAt = (booking as any).captureScheduledAt;
      if (captureAt && new Date(captureAt) <= new Date()) {
        // Las 48h ya pasaron y el artista acaba de confirmar → cobrar inmediatamente
        paymentsClient.captureBooking(id).catch(err =>
          logger.error("Error en captura inmediata post-confirmación", "BOOKING_SERVICE", { bookingId: id, error: err.message })
        );
        logger.info("Captura inmediata: ambas condiciones cumplidas al confirmar", "BOOKING_SERVICE", { bookingId: id, captureAt });
      } else {
        // Las 48h aún no han pasado → el cron runScheduledCaptures() capturará cuando llegue la hora
        logger.info("Captura diferida: artista confirmó pero las 48h aún no vencen", "BOOKING_SERVICE", { bookingId: id, captureAt });
      }
    } else if (
      booking.paymentStatus === 'PENDING' &&
      booking.anticipoRequired &&
      (booking as any).anticipoAmount > 0
    ) {
      // Cliente tenía tarjeta guardada — cobrar anticipo ahora que el artista confirmó
      paymentsClient.chargeDepositWithSavedCard(id).catch(err =>
        logger.error(
          "RECONCILIATION_NEEDED: fallo al cobrar anticipo post-confirmación con tarjeta guardada",
          "BOOKING_SERVICE",
          { bookingId: id, error: err.message }
        )
      );
    }

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
          anticipoRequired: booking.anticipoRequired,
          anticipoAmount: Number(booking.anticipoAmount),
        };

        await notifyBookingConfirmed(notificationData);

        const confirmedDate = new Date(notificationData.scheduledDate).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
        const confirmedMsg = `Tu reserva con ${notificationData.artistName} el ${confirmedDate} fue confirmada.`;
        notificationsClient.sendNotification({
          userId: booking.clientId,
          type: 'BOOKING_CONFIRMED',
          channel: 'IN_APP',
          title: '¡Reserva Confirmada!',
          message: confirmedMsg,
          data: { bookingId: id },
          priority: 'high',
          category: 'booking',
        }).catch(() => {});
        notificationsClient.sendNotification({
          userId: booking.clientId,
          type: 'BOOKING_CONFIRMED',
          channel: 'PUSH',
          title: '¡Reserva Confirmada!',
          message: confirmedMsg,
          data: { bookingId: id },
          priority: 'high',
          category: 'booking',
        }).catch(() => {});
      } catch (err: any) {
        logger.error('Error enviando notificación de confirmación', 'BOOKING_SERVICE', { error: err.message });
      }
    })();

    // Crear conversación de chat al confirmar la reserva
    chatClient.createConversation(booking.clientId, booking.artistId, id)
      .then(conv => {
        if (conv) logger.info("Conversación creada al confirmar", "BOOKING_SERVICE", { bookingId: id });
      })
      .catch(err => logger.error("Error creando conversación de chat", "BOOKING_SERVICE", { error: err.message }));

    // Flujo A: si el booking pertenece a un Event, verificar si hay ≥2 bookings confirmados
    // y crear/actualizar el grupo de coordinación de artistas para ese evento
    if (booking.eventId) {
      (async () => {
        try {
          const confirmedInEvent = await prisma.booking.findMany({
            where: {
              eventId: booking.eventId!,
              status: { in: ['CONFIRMED', 'ANTICIPO_PAID', 'IN_PROGRESS', 'FULLY_PAID'] },
            },
            select: { artistId: true },
          });
          if (confirmedInEvent.length >= 2) {
            const artistIds = [...new Set<string>(confirmedInEvent.map((b: { artistId: string }) => b.artistId))];
            await chatClient.createOrGetGroupConversation({
              eventId: booking.eventId!,
              createdBy: booking.artistId,
              participantIds: artistIds,
              name: `Coordinación evento`,
            });
            logger.info("Grupo de coordinación creado/actualizado para evento", "BOOKING_SERVICE", { eventId: booking.eventId });
          }
        } catch (err: any) {
          logger.error("Error creando grupo de coordinación por evento", "BOOKING_SERVICE", { error: err.message });
        }
      })();
    }

    // Sync Google Calendar (best-effort, non-blocking — silently skips if user has no tokens)
    ;(async () => {
      try {
        const [user, artist, service] = await Promise.all([
          usersClient.getUser(booking.clientId).catch(() => null),
          artistsClient.getArtist(booking.artistId).catch(() => null),
          catalogClient.getService(booking.serviceId).catch(() => null),
        ]);
        const endDateTime = new Date(booking.scheduledDate.getTime() + booking.durationMinutes * 60000).toISOString();
        const calEvent = {
          summary: `${(service as any)?.name || 'Servicio'} con ${(artist as any)?.artistName || 'artista'}`,
          description: `Reserva #${booking.code || id} — ${process.env.CLIENT_APP_URL || 'https://client.piums.io'}/bookings/${id}`,
          location: booking.location || '',
          startDateTime: booking.scheduledDate.toISOString(),
          endDateTime,
        };
        const [clientEventId, artistEventId] = await Promise.all([
          googleCalendarClient.createEvent(booking.clientId, calEvent),
          googleCalendarClient.createEvent(booking.artistId, calEvent),
        ]);
        if (clientEventId || artistEventId) {
          await (prisma as any).booking.update({
            where: { id },
            data: {
              ...(clientEventId && { clientCalendarEventId: clientEventId }),
              ...(artistEventId && { artistCalendarEventId: artistEventId }),
            },
          });
        }
      } catch (err: any) {
        logger.error('Error syncing Google Calendar on confirm', 'BOOKING_SERVICE', { bookingId: id, error: err.message });
      }
    })();

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

    // Liberar la pre-autorización si la tarjeta estaba retenida
    if (booking.paymentStatus === 'CARD_AUTHORIZED') {
      paymentsClient.voidBooking(id).catch(err =>
        logger.error("Error liberando pre-auth al rechazar reserva", "BOOKING_SERVICE", { bookingId: id, error: err.message })
      );
    }

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

    let refundAmount = 0;

    if (isClient) {
      if (booking.paymentStatus === 'CARD_AUTHORIZED') {
        // El dinero no ha salido de la tarjeta → void del pre-auth, sin cobro ni penalización.
        // Siempre aplica dentro de las primeras 48h (captureScheduledAt aún no venció)
        // o si el artista nunca confirmó (booking.status = PENDING).
        refundAmount = 0;
      } else if (booking.paidAmount > 0) {
        // Ya se capturó el cobro (paymentStatus = ANTICIPO_PAID) → penalización del 50%
        refundAmount = Math.floor(booking.paidAmount * 0.5);
      }
      // PENDING sin pago → cancelación libre, refundAmount = 0
    } else {
      // Artista cancela: reembolso 100% al cliente
      refundAmount = booking.paidAmount;

      // Penalización al artista si cancela una reserva CONFIRMED: 9% del totalPrice
      if (booking.status === "CONFIRMED" || booking.status === "PAYMENT_PENDING" || booking.status === "PAYMENT_COMPLETED") {
        const penaltyAmount = Math.round(booking.totalPrice * 0.09);

        // Crear CommissionRule de tipo FIXED_PENALTY en payments-service (fire-and-forget)
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
        const paymentsUrl = process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:4007';
        fetch(`${paymentsUrl}/api/commission-rules/internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret || '' },
          body: JSON.stringify({
            artistId: booking.artistId,
            type: 'FIXED_PENALTY',
            fixedAmount: penaltyAmount,
            currency: 'USD',
            reason: `Cancelación de reserva confirmada #${booking.code || booking.id}`,
            startDate: new Date().toISOString(),
            createdByAdminId: 'system',
          }),
        }).catch(err => logger.error('Error creando penalización por cancelación', 'BOOKING_SERVICE', { error: err.message }));

        logger.info("Penalización por cancelación de artista programada", "BOOKING_SERVICE", {
          bookingId: id,
          artistId: booking.artistId,
          penaltyAmount,
        });
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
        captureScheduledAt: null, // anular captura programada si existía
      },
    });

    await this.recordStatusChange(id, booking.status, newStatus, userId, reason);

    logger.info("Reserva cancelada", "BOOKING_SERVICE", {
      bookingId: id,
      userId,
      by: isClient ? "client" : "artist",
      refundAmount,
    });

    // Liberar la pre-autorización si la tarjeta estaba retenida (booking aún PENDING)
    if (booking.paymentStatus === 'CARD_AUTHORIZED') {
      paymentsClient.voidBooking(id).catch(err =>
        logger.error("Error liberando pre-auth al cancelar reserva", "BOOKING_SERVICE", { bookingId: id, error: err.message })
      );
    }

    // Liberar el slot de disponibilidad del artista
    removeAvailabilityReservation(id)
      .catch(() => { /* puede no existir si nunca fue CONFIRMED */ });

    // Cerrar conversación solo si la reserva ya había sido confirmada
    const confirmedStatuses = ["CONFIRMED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "IN_PROGRESS", "DELIVERED"];
    if (confirmedStatuses.includes(booking.status)) {
      chatClient.closeConversation(id, userId)
        .catch(err => logger.error("Error cerrando conversación de chat", "BOOKING_SERVICE", { error: err.message }));
    }

    // Iniciar reembolso si hay monto a devolver — await: si falla, se propaga al caller
    if (refundAmount > 0 && booking.paidAmount > 0) {
      await paymentsClient.createRefundInternal({
        bookingId: id,
        userId: booking.clientId,
        reason: isClient ? 'client_cancelled' : 'artist_cancelled',
        amount: refundAmount,
      });
    }

    // Enviar notificaciones de cancelación
    if (isClient) {
      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: 'BOOKING_CANCELLED',
        channel: 'IN_APP',
        title: 'Reserva Cancelada',
        message: `El cliente ha cancelado una reserva: ${reason}`,
        data: { bookingId: id, scheduledDate: booking.scheduledDate.toISOString(), reason, refundAmount },
        priority: 'high',
        category: 'booking',
      }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));
      notificationsClient.sendNotification({
        userId: booking.artistId,
        type: 'BOOKING_CANCELLED',
        channel: 'PUSH',
        title: 'Reserva Cancelada',
        message: `El cliente canceló la reserva #${booking.code || id.slice(0, 8)}.`,
        data: { bookingId: id },
        priority: 'high',
        category: 'booking',
      }).catch(() => {});
    } else {
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: 'BOOKING_CANCELLED',
        channel: 'IN_APP',
        title: 'Reserva Cancelada',
        message: `El artista ha cancelado tu reserva: ${reason}`,
        data: { bookingId: id, scheduledDate: booking.scheduledDate.toISOString(), reason, refundAmount },
        priority: 'high',
        category: 'booking',
      }).catch(err => logger.error('Error enviando notificación', 'BOOKING_SERVICE', { error: err.message }));
      notificationsClient.sendNotification({
        userId: booking.clientId,
        type: 'BOOKING_CANCELLED',
        channel: 'PUSH',
        title: 'Reserva Cancelada',
        message: `El artista canceló la reserva #${booking.code || id.slice(0, 8)}.`,
        data: { bookingId: id },
        priority: 'high',
        category: 'booking',
      }).catch(() => {});
    }

    // Remove Google Calendar events (best-effort)
    ;(async () => {
      try {
        const calData = await (prisma as any).booking.findUnique({
          where: { id },
          select: { clientCalendarEventId: true, artistCalendarEventId: true },
        });
        if (calData?.clientCalendarEventId) {
          googleCalendarClient.deleteEvent(booking.clientId, calData.clientCalendarEventId).catch(() => {});
        }
        if (calData?.artistCalendarEventId) {
          googleCalendarClient.deleteEvent(booking.artistId, calData.artistCalendarEventId).catch(() => {});
        }
      } catch {
        // Silently skip — calendar sync is best-effort
      }
    })();

    // Buscar artista de reemplazo si el artista cancela dentro de 72h del evento
    if (!isClient) {
      const hoursUntilEvent = (booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilEvent > 0 && hoursUntilEvent <= 72) {
        createReplacementPrompt(id).catch((err: any) =>
          logger.error('createReplacementPrompt error', 'BOOKING_SERVICE', { error: err.message, bookingId: id })
        );
      }
    }

    return updated;
  }

  // ==================== NO-SHOW ====================

  async reportNoShow(id: string, reportedByUserId: string, reason?: string) {
    const booking = await this.getBookingById(id);

    const isClient = booking.clientId === reportedByUserId;
    if (!isClient) {
      throw new AppError(403, "Solo el cliente puede reportar un no-show");
    }

    const validStatuses: string[] = ["CONFIRMED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "IN_PROGRESS", "DELIVERED"];
    if (!validStatuses.includes(booking.status)) {
      throw new AppError(400, `No se puede reportar no-show en estado: ${booking.status}`);
    }

    // Require at least 30 minutes past the scheduled start before reporting no-show
    const gracePeriodMs = 30 * 60 * 1000;
    if (booking.scheduledDate.getTime() + gracePeriodMs > Date.now()) {
      throw new AppError(400, "No puedes reportar un no-show hasta 30 minutos después del inicio de la reserva");
    }

    // Actualizar estado del booking
    await prisma.booking.update({
      where: { id },
      data: {
        status: "NO_SHOW",
        noShowAt: new Date(),
        noShowReportedBy: reportedByUserId,
        noShowReason: reason || null,
      },
    });

    await this.recordStatusChange(id, booking.status as any, "NO_SHOW", reportedByUserId, reason || "No-show reportado por cliente");

    // Crear disputa automáticamente
    const dispute = await prisma.dispute.create({
      data: {
        bookingId: id,
        reportedBy: reportedByUserId,
        reportedAgainst: booking.artistId,
        disputeType: "ARTIST_NO_SHOW",
        status: "OPEN",
        subject: `No-show en reserva #${booking.code || id}`,
        description: reason || "El artista no se presentó a la cita.",
        priority: 1,
      },
    });

    logger.info("No-show reportado", "BOOKING_SERVICE", { bookingId: id, disputeId: dispute.id });

    // Email al artista (tiene 24h para responder)
    ;(async () => {
      const artist = await artistsClient.getArtist(booking.artistId).catch(() => null);
      if (artist?.email) {
        notifyNoShowReported({
          artistEmail: artist.email,
          artistName: artist.artistName || 'Artista',
          bookingCode: booking.code || id.slice(0, 8).toUpperCase(),
          scheduledDate: booking.scheduledDate.toISOString(),
        }).catch(err => logger.error('Error enviando email no-show artista', 'BOOKING_SERVICE', { error: err.message }));
      }
    })();

    // Notificar al artista (tiene 24h para responder)
    notificationsClient.sendNotification({
      userId: booking.artistId,
      type: "BOOKING_NO_SHOW_ARTIST",
      channel: "IN_APP",
      title: "No-show reportado",
      message: `Se reportó un no-show en tu reserva #${booking.code || id}. Tienes 24 horas para responder antes de que se procesen las acciones.`,
      data: { bookingId: id, disputeId: dispute.id },
      priority: "high",
      category: "booking",
    }).catch(err => logger.error("Error enviando notificación no-show artista", "BOOKING_SERVICE", { error: err.message }));

    // Notificar a admin
    notificationsClient.sendNotification({
      userId: "admin",
      type: "BOOKING_NO_SHOW_ADMIN",
      channel: "IN_APP",
      title: "No-show reportado — revisión requerida",
      message: `Reserva #${booking.code || id}: cliente reportó no-show del artista.`,
      data: { bookingId: id, disputeId: dispute.id },
      priority: "high",
      category: "admin",
    }).catch(err => logger.error("Error enviando notificación no-show admin", "BOOKING_SERVICE", { error: err.message }));

    return { booking: await this.getBookingById(id), dispute };
  }

  async executeNoShowActions(bookingId: string, disputeId: string) {
    const booking = await this.getBookingById(bookingId);

    logger.info("Ejecutando acciones de no-show", "BOOKING_SERVICE", { bookingId, disputeId });

    // 1. Reembolso 100% de lo pagado
    if (booking.paidAmount > 0) {
      await paymentsClient.createRefundInternal({
        bookingId,
        userId: booking.clientId,
        reason: "artist_no_show",
        amount: booking.paidAmount,
      });
    }

    // 2. Crédito de compensación: max(18% × paidAmount, $20 USD) — solo si el cliente pagó algo
    if (booking.paidAmount > 0) {
      await paymentsClient.createCredit({
        userId: booking.clientId,
        bookingId,
        paidAmount: booking.paidAmount,
        reason: "NO_SHOW_COMPENSATION",
      });
    }

    // 3. Shadow ban al artista
    await artistsClient.shadowBan(booking.artistId, `No-show en reserva #${booking.code || bookingId}`);

    // 3b. Penalización en la siguiente reserva: comisión 27% (18% normal + 9% recargo por no-show)
    const paymentsUrl = process.env.PAYMENTS_SERVICE_URL || 'http://payments-service:4005';
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    fetch(`${paymentsUrl}/api/commission-rules/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret || '' },
      body: JSON.stringify({
        artistId: booking.artistId,
        type: 'RATE_OVERRIDE',
        rate: 27,
        isOneTime: true,
        currency: 'USD',
        reason: `Recargo por no-show sin justificación en reserva #${booking.code || bookingId}`,
        startDate: new Date().toISOString(),
        createdByAdminId: 'system',
      }),
    }).catch(err => logger.error('Error creando recargo no-show en siguiente reserva', 'BOOKING_SERVICE', { error: err.message }));

    // 4. Liberar disponibilidad
    removeAvailabilityReservation(bookingId)
      .catch(() => { /* puede no existir */ });

    // 5. Resolver la disputa
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolution: "FULL_REFUND",
        resolutionNotes: "Acciones automáticas ejecutadas: reembolso completo + crédito de compensación + cuenta restringida.",
        resolvedAt: new Date(),
        resolvedBy: "system",
        refundAmount: booking.paidAmount,
        refundIssued: true,
        refundIssuedAt: new Date(),
      },
    });

    // 6. Email al cliente: reembolso + crédito
    ;(async () => {
      const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '18');
      const creditAmount = Math.max(Math.round(booking.paidAmount * PLATFORM_FEE / 100), 2000);
      const user = await usersClient.getUser(booking.clientId).catch(() => null);
      if (user?.email) {
        notifyNoShowResolved({
          clientEmail: user.email,
          clientName: user.fullName || (user as any).nombre || 'Cliente',
          bookingCode: booking.code || bookingId.slice(0, 8).toUpperCase(),
          refundAmount: booking.paidAmount,
          creditAmount,
        }).catch(err => logger.error('Error enviando email resolución no-show', 'BOOKING_SERVICE', { error: err.message }));
      }
    })();

    // Notificar al cliente (IN_APP)
    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: "BOOKING_NO_SHOW_RESOLVED",
      channel: "IN_APP",
      title: "Reembolso y crédito procesados",
      message: `Tu reembolso por la reserva #${booking.code || bookingId.slice(0, 8).toUpperCase()} fue procesado. Tienes un crédito de compensación disponible por 90 días.`,
      data: { bookingId },
      priority: "high",
      category: "booking",
    }).catch(err => logger.error("Error enviando notificación resolución no-show", "BOOKING_SERVICE", { error: err.message }));

    // 7. Notificar al artista
    notificationsClient.sendNotification({
      userId: booking.artistId,
      type: "BOOKING_NO_SHOW_ARTIST_ACTION",
      channel: "IN_APP",
      title: "Cuenta restringida",
      message: "Tu cuenta ha sido restringida por no-show. Contacta soporte para reactivarla.",
      data: { bookingId },
      priority: "high",
      category: "booking",
    }).catch(err => logger.error("Error enviando notificación shadow ban artista", "BOOKING_SERVICE", { error: err.message }));

    logger.info("Acciones de no-show completadas", "BOOKING_SERVICE", { bookingId, disputeId });
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

    // Verificar ventana de cambio (no permitir si la fecha ya pasó o es <24h)
    const hoursUntilOriginalBooking =
      (booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilOriginalBooking < 0) {
      throw new AppError(400, "No puedes reprogramar una reserva cuya fecha ya pasó");
    }

    if (hoursUntilOriginalBooking < 24) {
      throw new AppError(
        400,
        "No puedes solicitar cambio de fecha con menos de 24 horas de anticipación"
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

    // Update Google Calendar events with new date/time (best-effort)
    ;(async () => {
      try {
        const calData = await (prisma as any).booking.findUnique({
          where: { id },
          select: { clientCalendarEventId: true, artistCalendarEventId: true },
        });
        const calUpdates = {
          startDateTime: newScheduledDate.toISOString(),
          endDateTime: new Date(newScheduledDate.getTime() + booking.durationMinutes * 60000).toISOString(),
        };
        if (calData?.clientCalendarEventId) {
          googleCalendarClient.updateEvent(booking.clientId, calData.clientCalendarEventId, calUpdates).catch(() => {});
        }
        if (calData?.artistCalendarEventId) {
          googleCalendarClient.updateEvent(booking.artistId, calData.artistCalendarEventId, calUpdates).catch(() => {});
        }
      } catch {
        // Silently skip — calendar sync is best-effort
      }
    })();

    return updated;
  }

  /**
   * Cambiar estado de reserva
   */
  async changeStatus(
    id: string,
    userId: string,
    newStatus: BookingStatus,
    reason?: string,
    productDeliveryUrl?: string
  ) {
    const booking = await this.getBookingById(id);

    // Validar transición de estado (state machine)
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      PENDING:            ['CONFIRMED', 'REJECTED', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      CONFIRMED:          ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      PAYMENT_PENDING:    ['PAYMENT_COMPLETED', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      PAYMENT_COMPLETED:  ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      ANTICIPO_PAID:      ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      FULLY_PAID:         ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
      IN_PROGRESS:        ['COMPLETED', 'NO_SHOW'],
      DELIVERED:          ['COMPLETED'],
      RESCHEDULED:        ['CONFIRMED', 'CANCELLED_ARTIST', 'CANCELLED_CLIENT'],
    };

    const allowedNext = ALLOWED_TRANSITIONS[booking.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      throw new AppError(400, `Transición de estado no permitida: ${booking.status} → ${newStatus}`);
    }

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

    // Artista marca como completado → transición a DELIVERED para iniciar ventana de confirmación
    if (newStatus === "COMPLETED") {
      const now = new Date();
      // Servicios con entrega de producto (foto/video) usan ventana de 48h en lugar de 24h
      const autoCompleteHours = (booking as any).requiresProductDelivery ? 48 : 24;
      const autoCompleteAt = new Date(now.getTime() + autoCompleteHours * 60 * 60 * 1000);
      const updated = await (prisma as any).booking.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: now,
          autoCompleteAt,
          ...(productDeliveryUrl ? { productDeliveryUrl } : {}),
        },
      });

      await this.recordStatusChange(id, booking.status, "DELIVERED", userId, reason || "Artista marcó el servicio como completado");

      logger.info("Booking marcado DELIVERED por artista", "BOOKING_SERVICE", { bookingId: id });

      // Notificaciones y payout hold en background (no bloquea la respuesta)
      ;(async () => {
        try {
          const holdUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          await paymentsClient.schedulePayoutHold(id, holdUntil.toISOString());

          const [clientUser, artistProfile, service] = await Promise.all([
            usersClient.getUser(booking.clientId).catch(() => null),
            artistsClient.getArtist(booking.artistId).catch(() => null),
            catalogClient.getService(booking.serviceId).catch(() => null),
          ]);

          const clientEmail = (clientUser as any)?.email;
          const clientName = (clientUser as any)?.fullName || (clientUser as any)?.firstName || 'Cliente';
          const artistName = (artistProfile as any)?.artistName || 'el artista';
          const serviceName = (service as any)?.name || (service as any)?.title || `Reserva #${booking.code || id}`;
          const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
          const confirmUrl = `${clientAppUrl}/bookings/${id}/confirm-delivery`;
          const disputeUrl = `${clientAppUrl}/bookings/${id}/report-problem`;
          const autoReleaseTime = holdUntil.toLocaleString('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'full', timeStyle: 'short' });
          const helpUrl = `${clientAppUrl}/soporte`;

          // IN_APP: notificar al cliente
          notificationsClient.sendNotification({
            userId: booking.clientId,
            type: "SERVICE_COMPLETED",
            channel: "IN_APP",
            title: "Servicio completado",
            message: `El artista marcó la reserva #${booking.code || id} como completada. Confirma la entrega o reporta un problema en las próximas 24 horas.`,
            data: { bookingId: id },
            priority: "high",
            category: "booking",
          }).catch(err => logger.error("Error enviando notif IN_APP completado", "BOOKING_SERVICE", { error: err.message }));

          // Email al cliente para que confirme entrega
          if (clientEmail) {
            await notificationsClient.sendDeliveryConfirmationEmail({
              clientEmail,
              clientName,
              artistName,
              serviceName,
              bookingCode: (booking as any).code || id,
              confirmUrl,
              disputeUrl,
              autoReleaseTime,
              helpUrl,
            });
          }
        } catch (err: any) {
          logger.error("Error en post-completado (payout hold / email)", "BOOKING_SERVICE", { bookingId: id, error: err.message });
        }
      })();

      return updated;
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
  /**
   * Marcar la tarjeta del cliente como pre-autorizada (fondos retenidos, no cobrados).
   * Se llama cuando el PI entra en estado REQUIRES_CAPTURE.
   */
  async markCardAuthorized(id: string, paymentIntentId?: string) {
    const booking = await this.getBookingById(id);

    if (booking.paymentStatus === 'CARD_AUTHORIZED') {
      logger.info("markCardAuthorized: ya está en CARD_AUTHORIZED, ignorando", "BOOKING_SERVICE", { bookingId: id });
      return booking;
    }

    // captureScheduledAt = createdAt + 48h (reloj corre desde la creación, no desde la confirmación)
    // El cobro se ejecuta cuando artista confirma + captureScheduledAt <= now (ambas condiciones)
    const captureScheduledAt = new Date(booking.createdAt.getTime() + 48 * 60 * 60 * 1000);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: 'CARD_AUTHORIZED',
        captureScheduledAt,
        ...(paymentIntentId && { providerPaymentId: paymentIntentId }),
      },
    });

    logger.info("Booking marcado como CARD_AUTHORIZED", "BOOKING_SERVICE", {
      bookingId: id, paymentIntentId, captureScheduledAt,
    });
    return updated;
  }

  async markPayment(
    id: string,
    amount: number,
    paymentMethod?: string,
    paymentIntentId?: string,
    paymentType?: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING'
  ) {
    const booking = await this.getBookingById(id);

    const updated = await prisma.$transaction(async (tx: any) => {
      // Idempotency guard: if providerPaymentId already matches, this payment was already
      // processed (e.g. both the Tilopay redirect and the server webhook arrived). Skip increment.
      if (paymentIntentId) {
        const current = await tx.booking.findUnique({
          where: { id },
          select: { providerPaymentId: true },
        });
        if (current?.providerPaymentId === paymentIntentId) {
          logger.warn("markPayment: providerPaymentId ya procesado, ignorando duplicado", "BOOKING_SERVICE", {
            bookingId: id, paymentIntentId,
          });
          return tx.booking.findUniqueOrThrow({ where: { id } });
        }
      }

      // Atomically increment paidAmount to avoid read-modify-write race conditions
      const afterIncrement = await tx.booking.update({
        where: { id },
        data: { paidAmount: { increment: amount } },
      });

      const newPaidAmount = afterIncrement.paidAmount;

      // Determine status from the actual (post-increment) paidAmount
      let newPaymentStatus: PaymentStatus = "PENDING";
      if (paymentType === 'DEPOSIT') {
        newPaymentStatus = "ANTICIPO_PAID";
      } else if (paymentType === 'FULL_PAYMENT' || newPaidAmount >= booking.totalPrice) {
        newPaymentStatus = "FULLY_PAID";
      } else if (booking.anticipoRequired && booking.anticipoAmount) {
        if (newPaidAmount >= booking.totalPrice) {
          newPaymentStatus = "FULLY_PAID";
        } else if (newPaidAmount >= booking.anticipoAmount) {
          newPaymentStatus = "ANTICIPO_PAID";
        }
      } else {
        if (newPaidAmount >= booking.totalPrice) {
          newPaymentStatus = "FULLY_PAID";
        }
      }

      return tx.booking.update({
        where: { id },
        data: {
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod || afterIncrement.paymentMethod,
          providerPaymentId: paymentIntentId || afterIncrement.providerPaymentId,
          paidAt: newPaymentStatus === "FULLY_PAID" ? new Date() : afterIncrement.paidAt,
          anticipoPaidAt:
            newPaymentStatus === "ANTICIPO_PAID" && !afterIncrement.anticipoPaidAt
              ? new Date()
              : afterIncrement.anticipoPaidAt,
        },
      });
    });

    const newPaidAmount = updated.paidAmount;
    const newPaymentStatus = updated.paymentStatus;

    logger.info("Pago registrado", "BOOKING_SERVICE", {
      bookingId: id,
      amount,
      newTotal: newPaidAmount,
      paymentStatus: newPaymentStatus,
      paymentType,
      paymentIntentId,
    });

    // Crear payout automático para el artista cuando el pago cambia de estado
    if (
      newPaymentStatus !== booking.paymentStatus &&
      (newPaymentStatus === "ANTICIPO_PAID" || newPaymentStatus === "FULLY_PAID")
    ) {
      const payoutType = newPaymentStatus === "ANTICIPO_PAID" ? "ANTICIPO" : "BOOKING_PAYMENT";
      const bookingCode = (updated as any).code || id.slice(0, 8).toUpperCase();
      ;(async () => {
        const result = await paymentsClient.createPayoutInternal({
          artistId: booking.artistId,
          bookingId: id,
          amount,
          currency: booking.currency,
          payoutType,
          description: `Pago reserva #${bookingCode}`,
        });
        if (result) {
          logger.info("Payout automático creado", "BOOKING_SERVICE", {
            bookingId: id,
            payoutType,
            amount,
            duplicate: result.duplicate ?? false,
          });
        } else {
          logger.error("Error creando payout automático", "BOOKING_SERVICE", { bookingId: id });
        }
      })();
    }

    // Enviar emails de "reserva creada" cuando el anticipo (o pago completo) se confirma por primera vez
    if (
      (newPaymentStatus === "ANTICIPO_PAID" || newPaymentStatus === "FULLY_PAID") &&
      booking.paymentStatus === "PENDING"
    ) {
      ;(async () => {
        try {
          const [user, artist, service] = await Promise.all([
            usersClient.getUser(updated.clientId),
            artistsClient.getArtist(updated.artistId),
            catalogClient.getService(updated.serviceId),
          ]);

          const clientName = user?.fullName || user?.nombre || 'Cliente';
          const serviceName = service?.name || 'Servicio';
          const bookingDate = new Date(updated.scheduledDate).toLocaleDateString('es-GT', {
            day: 'numeric', month: 'long',
          });

          await notifyBookingCreated({
            bookingId: updated.id,
            bookingCode: updated.code || updated.id.slice(0, 8).toUpperCase(),
            clientId: updated.clientId,
            clientName,
            clientEmail: user?.email || '',
            clientNotes: updated.clientNotes || '',
            artistId: updated.artistId,
            artistName: artist?.artistName || 'Artista',
            artistEmail: artist?.email || '',
            artistCategory: artist?.category || '',
            artistImage: artist?.avatar || '',
            serviceName,
            scheduledDate: updated.scheduledDate.toISOString(),
            durationMinutes: updated.durationMinutes,
            location: updated.location || '',
            servicePrice: Number(updated.totalPrice),
            totalPrice: Number(updated.totalPrice),
            currency: updated.currency,
            anticipoRequired: updated.anticipoRequired,
            anticipoAmount: Number(updated.anticipoAmount),
            eventType: (updated as any).eventType || undefined,
          });

          // Push + IN_APP al artista para que confirme la reserva
          const pushMsg = `${clientName} reservó "${serviceName}" para el ${bookingDate}. Confírmala en tu app.`;
          notificationsClient.sendNotification({
            userId: updated.artistId,
            type: 'NEW_BOOKING',
            channel: 'IN_APP',
            title: 'Nueva solicitud de reserva',
            message: pushMsg,
            data: { bookingId: updated.id, bookingCode: updated.code || '' },
            priority: 'high',
            category: 'booking',
          }).catch(() => {});
          notificationsClient.sendNotification({
            userId: updated.artistId,
            type: 'NEW_BOOKING',
            channel: 'PUSH',
            title: 'Nueva solicitud de reserva',
            message: pushMsg,
            data: { bookingId: updated.id, bookingCode: updated.code || '' },
            priority: 'high',
            category: 'booking',
          }).catch(() => {});
        } catch (err: any) {
          logger.error('Error enviando notificación de reserva con pago confirmado', 'BOOKING_SERVICE', { error: err.message });
        }
      })();
    }

    return updated;
  }

  // ==================== CÓDIGO DE ASISTENCIA ====================

  async verifyAttendanceCode(bookingId: string, artistId: string, code: string) {
    const booking = await this.getBookingById(bookingId);

    if (booking.artistId !== artistId) {
      throw new AppError(403, 'No tienes permiso para verificar esta reserva');
    }

    const validStatuses = ['CONFIRMED', 'IN_PROGRESS'];
    if (!validStatuses.includes(booking.status)) {
      throw new AppError(400, `La reserva no está en estado activo (estado actual: ${booking.status})`);
    }

    if ((booking as any).attendanceCodeUsedAt) {
      throw new AppError(400, 'El código de asistencia ya fue utilizado para esta reserva');
    }

    if ((booking as any).attendanceCode !== code.trim()) {
      throw new AppError(400, 'Código de asistencia incorrecto');
    }

    const now = new Date();
    const requiresProductDelivery = (booking as any).requiresProductDelivery ?? false;

    if (requiresProductDelivery) {
      // Fotógrafos/videógrafos: solo confirmar asistencia, sin cobro todavía
      const updated = await (prisma as any).booking.update({
        where: { id: bookingId },
        data: {
          status: 'IN_PROGRESS',
          attendanceCodeUsedAt: now,
        },
      });

      await this.recordStatusChange(
        bookingId,
        booking.status as BookingStatus,
        'IN_PROGRESS',
        artistId,
        'Asistencia confirmada con código — pendiente entrega de producto'
      );

      logger.info('Código de asistencia verificado (con entrega de producto)', 'BOOKING_SERVICE', { bookingId, artistId });

      // Notificar al cliente que el artista llegó
      ;(async () => {
        try {
          const artistProfile = await artistsClient.getArtist(booking.artistId).catch(() => null);
          const artistName = (artistProfile as any)?.artistName || 'El artista';
          notificationsClient.sendNotification({
            userId: (booking as any).clientId,
            type: 'ATTENDANCE_CONFIRMED',
            channel: 'IN_APP',
            title: 'Artista presente',
            message: `${artistName} confirmó su asistencia. Recibirás el producto terminado en los próximos días.`,
            data: { bookingId },
            priority: 'normal',
            category: 'booking',
          }).catch(() => {});
        } catch { /* notif no crítica */ }
      })();

      return updated;
    }

    // Servicio en vivo (músicos, DJs, etc.): completar y cobrar inmediatamente
    const updated = await (prisma as any).booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        attendanceCodeUsedAt: now,
        deliveredAt: now,
        deliveryConfirmedAt: now,
        deliveryConfirmedBy: artistId,
      },
    });

    await this.recordStatusChange(
      bookingId,
      booking.status as BookingStatus,
      'COMPLETED',
      artistId,
      'Código de asistencia verificado — servicio completado'
    );

    logger.info('Código de asistencia verificado — reserva completada y pago en proceso', 'BOOKING_SERVICE', { bookingId, artistId });

    // Pago en background (patrón fire-and-forget idéntico al resto del servicio)
    ;(async () => {
      try {
        if ((booking as any).paymentStatus === 'CARD_AUTHORIZED') {
          await paymentsClient.captureBooking(bookingId);
        } else if ((booking as any).paymentStatus === 'ANTICIPO_PAID') {
          await paymentsClient.chargeRemainingBalance(bookingId);
        }
        await paymentsClient.schedulePayoutHold(bookingId, null);
      } catch (err: any) {
        logger.error('Error procesando pago tras verificación de código', 'BOOKING_SERVICE', { bookingId, error: err.message });
      }
    })();

    // Notificaciones en background
    ;(async () => {
      try {
        const [clientUser, artistProfile, service] = await Promise.all([
          usersClient.getUser((booking as any).clientId).catch(() => null),
          artistsClient.getArtist(booking.artistId).catch(() => null),
          catalogClient.getService((booking as any).serviceId).catch(() => null),
        ]);

        const artistName = (artistProfile as any)?.artistName || 'Artista';
        const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';

        notificationsClient.sendNotification({
          userId: booking.artistId,
          type: 'DELIVERY_CONFIRMED',
          channel: 'IN_APP',
          title: 'Asistencia confirmada',
          message: 'El código fue verificado. El pago será liberado a tu cuenta.',
          data: { bookingId },
          priority: 'high',
          category: 'booking',
        }).catch(() => {});

        notificationsClient.sendNotification({
          userId: (booking as any).clientId,
          type: 'REVIEW_REQUEST',
          channel: 'IN_APP',
          title: '¿Cómo fue tu experiencia?',
          message: `Deja una reseña sobre el servicio de ${artistName}.`,
          data: { bookingId, reviewUrl: `${clientAppUrl}/bookings/${bookingId}?review=1` },
          priority: 'normal',
          category: 'review',
        }).catch(() => {});
      } catch { /* notif no crítica */ }
    })();

    return updated;
  }

  // ==================== CONFIRMACION DE ENTREGA ====================

  async confirmDelivery(bookingId: string, clientId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if ((booking as any).clientId !== clientId) throw new AppError(403, 'No tienes permiso para confirmar esta reserva');
    if ((booking as any).status !== 'DELIVERED') throw new AppError(400, 'La reserva no está en estado DELIVERED');
    if ((booking as any).deliveryConfirmedAt) throw new AppError(400, 'La entrega ya fue confirmada anteriormente');

    const updated = await (prisma as any).booking.update({
      where: { id: bookingId },
      data: {
        deliveryConfirmedAt: new Date(),
        deliveryConfirmedBy: clientId,
      },
    });

    // Liberar payout hold inmediatamente — await: si falla, la entrega no queda confirmada
    await paymentsClient.schedulePayoutHold(bookingId, null);

    // Notificar al artista en background
    ;(async () => {
      try {
        const [clientUser, artistProfile, service] = await Promise.all([
          usersClient.getUser(clientId).catch(() => null),
          artistsClient.getArtist((booking as any).artistId).catch(() => null),
          catalogClient.getService((booking as any).serviceId).catch(() => null),
        ]);

        const artistEmail = (artistProfile as any)?.email || (artistProfile as any)?.user?.email;
        const artistName = (artistProfile as any)?.artistName || 'Artista';
        const clientName = (clientUser as any)?.fullName || (clientUser as any)?.firstName || 'El cliente';
        const serviceName = (service as any)?.name || (service as any)?.title || `Reserva #${(booking as any).code || bookingId}`;
        const artistAppUrl = process.env.ARTIST_APP_URL || 'http://localhost:3002';

        notificationsClient.sendNotification({
          userId: (booking as any).artistId,
          type: "DELIVERY_CONFIRMED",
          channel: "IN_APP",
          title: "Entrega confirmada",
          message: "El cliente confirmó la entrega del servicio. El pago será liberado a tu cuenta.",
          data: { bookingId },
          priority: "high",
          category: "booking",
        }).catch(err => logger.error("Error enviando notif IN_APP artista delivery confirmed", "BOOKING_SERVICE", { error: err.message }));

        // Solicitar reseña al cliente
        const clientAppUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
        notificationsClient.sendNotification({
          userId: clientId,
          type: "REVIEW_REQUEST",
          channel: "IN_APP",
          title: "¿Cómo fue tu experiencia?",
          message: `Deja una reseña sobre el servicio de ${artistName}. Tu opinión ayuda a otros clientes.`,
          data: { bookingId, reviewUrl: `${clientAppUrl}/bookings/${bookingId}?review=1` },
          priority: "normal",
          category: "review",
        }).catch(err => logger.error("Error enviando REVIEW_REQUEST", "BOOKING_SERVICE", { error: err.message }));

        if (artistEmail) {
          await notificationsClient.sendDeliveryConfirmedArtistEmail({
            artistEmail,
            artistName,
            clientName,
            serviceName,
            bookingCode: (booking as any).code || bookingId,
            dashboardUrl: `${artistAppUrl}/artist/dashboard/bookings/${bookingId}`,
          });
        }
      } catch (err: any) {
        logger.error("Error notificando artista tras confirmacion entrega", "BOOKING_SERVICE", { bookingId, error: err.message });
      }
    })();

    logger.info('Entrega confirmada por cliente', 'BOOKING_SERVICE', { bookingId, clientId });
    return updated;
  }

  async reportDeliveryProblem(bookingId: string, clientId: string, reason?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if ((booking as any).clientId !== clientId) throw new AppError(403, 'No tienes permiso para reportar un problema en esta reserva');
    if ((booking as any).status !== 'DELIVERED') throw new AppError(400, 'Solo se puede reportar un problema en reservas en estado DELIVERED');
    if ((booking as any).deliveryConfirmedAt) throw new AppError(400, 'La entrega ya fue confirmada, no se puede abrir una disputa');

    // Cambiar estado a DISPUTE_OPEN — el cron de auto-release solo procesa DELIVERED, queda congelado
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'DISPUTE_OPEN' as any,
        disputeReason: reason || null,
      },
    });

    await this.recordStatusChange(bookingId, (booking as any).status, 'DISPUTE_OPEN', clientId, reason || 'Cliente reportó problema con la entrega');

    // Crear disputa
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        reportedBy: clientId,
        reportedAgainst: (booking as any).artistId,
        disputeType: 'QUALITY' as any,
        status: 'OPEN',
        subject: `Problema con entrega — reserva #${(booking as any).code || bookingId}`,
        description: reason || 'El cliente reportó que no recibió el servicio correctamente.',
        priority: 2,
      },
    });

    logger.info('Problema de entrega reportado', 'BOOKING_SERVICE', { bookingId, clientId, disputeId: dispute.id });

    // Alertar admin (in-app)
    notificationsClient.sendNotification({
      userId: 'admin',
      type: 'DELIVERY_PROBLEM_REPORTED',
      channel: 'IN_APP',
      title: 'Problema de entrega reportado',
      message: `Reserva #${(booking as any).code || bookingId}: el cliente reportó que no recibio el servicio. Pago congelado hasta revision.`,
      data: { bookingId, disputeId: dispute.id },
      priority: 'high',
      category: 'admin',
    }).catch(err => logger.error('Error notificando admin disputa entrega', 'BOOKING_SERVICE', { error: err.message }));

    return { booking: await this.getBookingById(bookingId), dispute };
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

    // Obtener reglas de disponibilidad del artista desde artists-service.
    // Si el artista no tiene reglas configuradas, cae al fallback 9am-6pm lun-vier.
    const availabilityRules = await artistsClient.getArtistAvailability(artistId);
    const DAY_MAP: Record<number, string> = {
      0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
      4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO',
    };

    const slots: { start: Date; end: Date }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const jsDay = currentDate.getDay();
      const dayName = DAY_MAP[jsDay];

      // Reglas del artista para este día de la semana
      const dayRules = availabilityRules.filter(r => r.dayOfWeek === dayName);

      // Fallback: si no hay reglas configuradas, usar 9am-6pm lun-vier
      const workRanges = dayRules.length > 0
        ? dayRules.map(r => ({
            startHour: parseInt(r.startTime.split(':')[0], 10),
            startMin: parseInt(r.startTime.split(':')[1] ?? '0', 10),
            endHour: parseInt(r.endTime.split(':')[0], 10),
            endMin: parseInt(r.endTime.split(':')[1] ?? '0', 10),
          }))
        : (jsDay >= 1 && jsDay <= 5 ? [{ startHour: 9, startMin: 0, endHour: 18, endMin: 0 }] : []);

      for (const range of workRanges) {
        for (let hour = range.startHour; hour < range.endHour; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // El slot debe terminar dentro del rango de trabajo
          const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();
          const rangeEndMinutes = range.endHour * 60 + range.endMin;
          if (slotEndMinutes <= rangeEndMinutes) {
            const isAvailable = await this.checkAvailability(artistId, slotStart, slotEnd);
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
        where: { ...where, status: { notIn: ["CANCELLED_CLIENT", "CANCELLED_ARTIST", "REJECTED"] } },
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
  async getAdminStats(months: number = 6) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      stats,
      revenueThisMonth,
      bookingsThisMonth,
      bookingsByMonth,
      revenueByMonth,
      topArtists,
    ] = await Promise.all([
      this.getBookingStats(),
      prisma.booking.aggregate({
        where: {
          status: { notIn: ["CANCELLED_CLIENT", "CANCELLED_ARTIST", "REJECTED"] },
          scheduledDate: { gte: startOfMonth }
        },
        _sum: { totalPrice: true }
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.getBookingsByMonth(months),
      this.getRevenueByMonth(months),
      this.getTopArtistsByBookings(months, 5),
    ]);

    return {
      ...stats,
      revenueThisMonth: revenueThisMonth._sum.totalPrice || 0,
      bookingsThisMonth,
      bookingsByMonth,
      revenueByMonth,
      topArtists,
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

  private async getRevenueByMonth(monthsCount: number) {
    const result = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const agg = await prisma.booking.aggregate({
        where: { status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_ARTIST', 'REJECTED'] }, scheduledDate: { gte: d, lt: nextD } },
        _sum: { totalPrice: true },
      });

      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      result.push({ month: monthName, amount: Number(agg._sum.totalPrice ?? 0) });
    }

    return result;
  }

  private async getTopArtistsByBookings(monthsCount: number, limit: number) {
    const periodStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - monthsCount + 1,
      1
    );

    const grouped = await prisma.booking.groupBy({
      by: ['artistId'],
      where: { createdAt: { gte: periodStart } },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return grouped.map((g: any) => ({
      artistId: g.artistId,
      bookings: g._count.id,
      revenue: Number(g._sum.totalPrice ?? 0),
    }));
  }

  /**
   * Búsqueda avanzada para admin
   */
  async adminSearchBookings(filters: {
    search?: string;
    status?: BookingStatus;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  }) {
    const { search, status, dateFrom, dateTo, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
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
    return [...new Set<string>(bookings.map((b: { artistId: string }) => b.artistId))];
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

    if (request.tokenExpiresAt && request.tokenExpiresAt < new Date()) {
      await prisma.rescheduleRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError(410, "El enlace de confirmación ha expirado. Por favor solicita un nuevo cambio de fecha.");
    }

    // Atomic update: only succeeds if status is still PENDING_CLIENT (concurrent-request guard)
    const { count } = await prisma.rescheduleRequest.updateMany({
      where: { id: request.id, status: "PENDING_CLIENT" },
      data: { status: "CONFIRMED", clientConfirmedAt: new Date(), confirmationToken: null },
    });

    if (count === 0) {
      if (request.status === "CONFIRMED") {
        throw new AppError(400, "Este cambio de fecha ya fue confirmado");
      }
      throw new AppError(400, "Este enlace ya no es válido");
    }

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

  // ==================== REEMPLAZO DE EMERGENCIA ====================

  async getReplacementSearch(bookingId: string, requestingUserId: string) {
    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true },
    });
    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if (booking.clientId !== requestingUserId) throw new AppError(403, 'Acceso denegado');

    return (prisma as any).replacementSearch.findUnique({ where: { bookingId } });
  }

  async acceptReplacement(bookingId: string, userId: string) {
    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true },
    });
    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if (booking.clientId !== userId) throw new AppError(403, 'Acceso denegado');

    const record = await (prisma as any).replacementSearch.findUnique({ where: { bookingId } });
    if (!record) throw new AppError(404, 'No hay búsqueda de reemplazo para esta reserva');
    if (record.status !== 'AWAITING_CLIENT') throw new AppError(400, 'Esta búsqueda ya fue procesada');
    if (new Date(record.expiresAt) <= new Date()) throw new AppError(400, 'El tiempo para responder ha vencido');

    const { runReplacementSearch } = await import('./replacement.service');
    runReplacementSearch(record.id).catch((err: any) =>
      logger.error('runReplacementSearch error', 'BOOKING_SERVICE', { error: err.message, replacementSearchId: record.id })
    );

    return { message: 'Buscando artistas de reemplazo...' };
  }

  async declineReplacement(bookingId: string, userId: string) {
    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true },
    });
    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if (booking.clientId !== userId) throw new AppError(403, 'Acceso denegado');

    const record = await (prisma as any).replacementSearch.findUnique({ where: { bookingId } });
    if (!record) throw new AppError(404, 'No hay búsqueda de reemplazo para esta reserva');
    if (record.status !== 'AWAITING_CLIENT') throw new AppError(400, 'Esta búsqueda ya fue procesada');

    await (prisma as any).replacementSearch.update({
      where: { bookingId },
      data: { status: 'OPTED_OUT' },
    });

    return { message: 'De acuerdo, conservarás el reembolso completo.' };
  }
}

export const bookingService = new BookingService();
