import prisma from "../lib/prisma";
import { PaymentStatus, PaymentType, PaymentIntentStatus, RefundStatus, CreditStatus } from "../types/prisma-enums";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";
import { bookingClient } from "../clients/booking.client";
import { notificationsClient } from "../clients/notifications.client";
import { PaymentMethodService } from "./paymentMethod.service";

const paymentMethodService = new PaymentMethodService();

export class PaymentService {
  // ==================== PAYMENT INTENTS ====================

  /**
   * Crear Payment Intent
   */
  async createPaymentIntent(data: {
    userId: string;
    bookingId?: string;
    amount: number;
    currency?: string;
    description?: string;
    paymentMethods?: string[];
    metadata?: Record<string, any>;
  }) {
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "USD";

    // Si hay bookingId, validar que exista y pertenezca al usuario
    if (data.bookingId) {
      const booking = await bookingClient.getBooking(data.bookingId);
      if (!booking) {
        throw new AppError(404, "Reserva no encontrada");
      }
      if (booking.clientId !== data.userId) {
        throw new AppError(403, "No tienes permiso para pagar esta reserva");
      }
    }

    // Crear Payment Intent en Stripe
    const stripePaymentIntent = await stripeProvider.createPaymentIntent({
      amount: data.amount,
      currency,
      description: data.description,
      metadata: {
        userId: data.userId,
        ...(data.bookingId && { bookingId: data.bookingId }),
        ...data.metadata,
      },
      paymentMethodTypes: data.paymentMethods || ["card"],
    });

    // Guardar en base de datos
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        stripePaymentIntentId: stripePaymentIntent.id,
        userId: data.userId,
        bookingId: data.bookingId,
        amount: data.amount,
        currency,
        status: this.mapStripeStatusToPaymentIntentStatus(stripePaymentIntent.status),
        clientSecret: stripePaymentIntent.client_secret || undefined,
        paymentMethods: data.paymentMethods || ["card"],
        description: data.description,
        metadata: data.metadata,
      },
    });

    logger.info("Payment Intent creado", "PAYMENT_SERVICE", {
      paymentIntentId: paymentIntent.id,
      stripePaymentIntentId: stripePaymentIntent.id,
      amount: data.amount,
      userId: data.userId,
    });

    return {
      ...paymentIntent,
      clientSecret: stripePaymentIntent.client_secret,
    };
  }

  /**
   * Obtener Payment Intent por ID
   */
  async getPaymentIntent(id: string, userId: string) {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id },
    });

    if (!paymentIntent) {
      throw new AppError(404, "Payment Intent no encontrado");
    }

    // Verificar permisos
    if (paymentIntent.userId !== userId) {
      throw new AppError(403, "No tienes permiso para ver este payment intent");
    }

    return paymentIntent;
  }

  /**
   * Confirmar Payment Intent
   */
  async confirmPaymentIntent(stripePaymentIntentId: string, userId: string) {
    // Buscar payment intent en BD
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!paymentIntent) {
      throw new AppError(404, "Payment Intent no encontrado");
    }

    if (paymentIntent.userId !== userId) {
      throw new AppError(403, "No tienes permiso para confirmar este payment");
    }

    // Confirmar en Stripe
    const stripePaymentIntent = await stripeProvider.confirmPaymentIntent(
      stripePaymentIntentId
    );

    // Actualizar estado
    const updated = await prisma.paymentIntent.update({
      where: { stripePaymentIntentId },
      data: {
        status: this.mapStripeStatusToPaymentIntentStatus(stripePaymentIntent.status),
        confirmedAt: stripePaymentIntent.status === "succeeded" ? new Date() : undefined,
      },
    });

    logger.info("Payment Intent confirmado", "PAYMENT_SERVICE", {
      paymentIntentId: paymentIntent.id,
      status: updated.status,
    });

    return updated;
  }

  /**
   * Cancelar Payment Intent
   */
  async cancelPaymentIntent(stripePaymentIntentId: string, userId: string) {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!paymentIntent) {
      throw new AppError(404, "Payment Intent no encontrado");
    }

    if (paymentIntent.userId !== userId) {
      throw new AppError(403, "No tienes permiso para cancelar este payment");
    }

    // Cancelar en Stripe
    await stripeProvider.cancelPaymentIntent(stripePaymentIntentId);

    // Actualizar estado
    const updated = await prisma.paymentIntent.update({
      where: { stripePaymentIntentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    logger.info("Payment Intent cancelado", "PAYMENT_SERVICE", {
      paymentIntentId: paymentIntent.id,
    });

    return updated;
  }

  // ==================== PAYMENTS ====================

  /**
   * Registrar pago exitoso (llamado desde webhook)
   */
  async recordPayment(data: {
    stripePaymentIntentId: string;
    stripeChargeId?: string;
    amount: number;
    amountReceived?: number;
    currency: string;
    paymentType: PaymentType;
    paymentMethod?: string;
    paymentMethodDetails?: any;
    metadata?: any;
  }) {
    // Buscar payment intent
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { stripePaymentIntentId: data.stripePaymentIntentId },
    });

    if (!paymentIntent) {
      logger.warn("Payment Intent no encontrado al registrar pago", "PAYMENT_SERVICE", {
        stripePaymentIntentId: data.stripePaymentIntentId,
      });
      throw new AppError(404, "Payment Intent no encontrado");
    }

    // Crear registro de pago
    const payment = await prisma.payment.create({
      data: {
        userId: paymentIntent.userId,
        bookingId: paymentIntent.bookingId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeChargeId: data.stripeChargeId,
        amount: data.amount,
        currency: data.currency,
        amountReceived: data.amountReceived,
        status: "SUCCEEDED",
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        paymentMethodDetails: data.paymentMethodDetails,
        metadata: data.metadata,
        paidAt: new Date(),
      },
    });

    logger.info("Pago registrado exitosamente", "PAYMENT_SERVICE", {
      paymentId: payment.id,
      amount: payment.amount,
      bookingId: payment.bookingId,
    });

    // Actualizar booking si corresponde
    if (payment.bookingId) {
      const marked = await bookingClient.markPayment(
        payment.bookingId,
        payment.amount,
        payment.paymentMethod || undefined,
        payment.stripePaymentIntentId || undefined,
        payment.paymentType === "DEPOSIT" ? "DEPOSIT" : "FULL_PAYMENT"
      );
      if (!marked) {
        // Payment recorded in DB but booking not updated — needs manual reconciliation.
        // booking-service may have been temporarily unavailable.
        logger.error(
          "RECONCILIATION_NEEDED: markPayment falló tras registrar pago exitoso",
          "PAYMENT_SERVICE",
          {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            amount: payment.amount,
            currency: payment.currency,
            paymentType: payment.paymentType,
            stripePaymentIntentId: payment.stripePaymentIntentId || null,
          }
        );
      }
    }

    // Enviar notificación
    notificationsClient
      .sendNotification({
        userId: payment.userId,
        type: "PAYMENT_RECEIVED",
        channel: "IN_APP",
        title: "Pago Recibido",
        message: `Tu pago de $${(payment.amount / 100).toFixed(2)} ha sido procesado exitosamente`,
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          currency: payment.currency,
        },
        priority: "high",
        category: "payment",
      })
      .catch((err) =>
        logger.error("Error enviando notificación de pago", "PAYMENT_SERVICE", {
          error: err,
        })
      );

    return payment;
  }

  /**
   * Buscar pagos con filtros
   */
  async searchPayments(filters: {
    userId?: string;
    bookingId?: string;
    status?: PaymentStatus;
    paymentType?: PaymentType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentType) where.paymentType = filters.paymentType;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          refunds: {
            where: { deletedAt: null },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener pago por ID
   */
  async getPaymentById(id: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        refunds: {
          where: { deletedAt: null },
        },
      },
    });

    if (!payment) {
      throw new AppError(404, "Pago no encontrado");
    }

    if (payment.userId !== userId) {
      throw new AppError(403, "No tienes permiso para ver este pago");
    }

    return payment;
  }

  // ==================== REFUNDS ====================

  /**
   * Crear refund
   */
  async createRefund(data: {
    paymentId: string;
    requestedBy: string;
    amount?: number;
    reason?: string;
    metadata?: any;
  }) {
    // Pre-check: validar que el pago exista y pertenezca al usuario antes de abrir la transacción
    const paymentCheck = await prisma.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!paymentCheck) {
      throw new AppError(404, "Pago no encontrado");
    }

    if (paymentCheck.userId !== data.requestedBy) {
      throw new AppError(403, "No tienes permiso para reembolsar este pago");
    }

    if (paymentCheck.status !== "SUCCEEDED") {
      throw new AppError(400, "Solo se pueden reembolsar pagos exitosos");
    }

    // Dentro de la transacción: re-leer con bloqueo, verificar disponibilidad y reservar
    // creando el refund en estado PENDING como lock optimista.
    const { refundRecord, payment, refundAmount } = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({
        where: { id: data.paymentId },
        include: { refunds: { where: { status: { not: "FAILED" } } } },
      });

      if (!payment) {
        throw new AppError(404, "Pago no encontrado");
      }

      const alreadyRefunded = payment.refunds.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
      const availableForRefund = payment.amount - alreadyRefunded;

      if (availableForRefund <= 0) {
        throw new AppError(400, "Este pago ya ha sido reembolsado completamente");
      }

      const refundAmount = data.amount
        ? Math.min(data.amount, availableForRefund)
        : availableForRefund;

      if (refundAmount > availableForRefund) {
        throw new AppError(409, `Solo quedan ${availableForRefund} centavos disponibles para reembolso`);
      }

      // Crear registro PENDING como reserva atómica — impide que una segunda solicitud
      // concurrente cuente el mismo monto como disponible hasta que el estado cambie.
      const refundRecord = await tx.refund.create({
        data: {
          paymentId: payment.id,
          requestedBy: data.requestedBy,
          amount: refundAmount,
          currency: payment.currency,
          status: "PENDING",
          reason: data.reason,
          metadata: data.metadata,
        },
      });

      return { refundRecord, payment, refundAmount };
    });

    // Fuera de la transacción: llamar a Stripe (las transacciones no pueden esperar I/O externo)
    let stripeRefund: Awaited<ReturnType<typeof stripeProvider.createRefund>>;
    try {
      stripeRefund = await stripeProvider.createRefund({
        paymentIntentId: payment.stripePaymentIntentId || undefined,
        chargeId: payment.stripeChargeId || undefined,
        amount: refundAmount,
        reason: "requested_by_customer",
        metadata: {
          paymentId: payment.id,
          requestedBy: data.requestedBy,
          ...data.metadata,
        },
      });
    } catch (stripeErr: any) {
      // Stripe falló — marcar el registro PENDING como FAILED para liberar el monto reservado
      await prisma.refund.update({
        where: { id: refundRecord.id },
        data: { status: "FAILED" },
      });
      logger.error("Error al crear refund en Stripe", "PAYMENT_SERVICE", {
        refundId: refundRecord.id,
        paymentId: payment.id,
        error: stripeErr.message,
      });
      throw stripeErr;
    }

    // Actualizar el registro con datos reales de Stripe
    const refund = await prisma.refund.update({
      where: { id: refundRecord.id },
      data: {
        stripeRefundId: stripeRefund.id,
        status: this.mapStripeRefundStatus(stripeRefund.status ?? 'pending'),
        processedAt: stripeRefund.status === "succeeded" ? new Date() : undefined,
      },
    });

    // Actualizar estado del pago
    const previousRefundedAmount = payment.refunds.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
    const newRefundedAmount = previousRefundedAmount + refundAmount;
    const newStatus =
      newRefundedAmount >= payment.amount
        ? "FULLY_REFUNDED"
        : "PARTIALLY_REFUNDED";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        refundedAmount: newRefundedAmount,
      },
    });

    logger.info("Refund creado", "PAYMENT_SERVICE", {
      refundId: refund.id,
      paymentId: payment.id,
      amount: refundAmount,
    });

    // Enviar notificación
    notificationsClient
      .sendNotification({
        userId: payment.userId,
        type: "PAYMENT_REFUNDED",
        channel: "IN_APP",
        title: "Reembolso Procesado",
        message: `Se ha procesado un reembolso de $${(refundAmount / 100).toFixed(2)}`,
        data: {
          refundId: refund.id,
          paymentId: payment.id,
          amount: refundAmount,
          currency: payment.currency,
        },
        priority: "high",
        category: "payment",
      })
      .catch((err) =>
        logger.error("Error enviando notificación de refund", "PAYMENT_SERVICE", {
          error: err,
        })
      );

    return refund;
  }

  /**
   * Obtener refund por ID
   */
  async getRefundById(id: string, userId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new AppError(404, "Reembolso no encontrado");
    }

    if (refund.payment.userId !== userId) {
      throw new AppError(403, "No tienes permiso para ver este reembolso");
    }

    return refund;
  }

  // ==================== STATISTICS ====================

  /**
   * Obtener estadísticas de pagos
   */
  async getPaymentStats(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [stats, statusBreakdown] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: "SUCCEEDED" },
        _sum: { amount: true, refundedAmount: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalAmount: stats._sum.amount || 0,
      totalRefunded: stats._sum.refundedAmount || 0,
      netAmount: (stats._sum.amount || 0) - (stats._sum.refundedAmount || 0),
      totalPayments: stats._count,
      byStatus: statusBreakdown.map((s: any) => ({
        status: s.status,
        count: s._count,
        amount: s._sum.amount || 0,
      })),
    };
  }

  // ==================== CREDITS ====================

  async createCredit(data: {
    userId: string;
    bookingId?: string;
    paidAmount: number;
    reason: string;
  }) {
    const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "18");
    const platformFee = Math.round(data.paidAmount * (PLATFORM_FEE / 100));
    const creditAmount = Math.max(platformFee, 2000); // mínimo $20.00 USD

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const credit = await prisma.credit.create({
      data: {
        userId: data.userId,
        bookingId: data.bookingId,
        amount: creditAmount,
        currency: "USD",
        status: CreditStatus.ACTIVE,
        reason: data.reason,
        expiresAt,
      },
    });

    logger.info(`Credit created: ${credit.id}`, "CREDIT", {
      userId: data.userId,
      bookingId: data.bookingId,
      amount: creditAmount,
      expiresAt,
    });

    notificationsClient.sendNotification({
      userId: data.userId,
      type: "CREDIT_ISSUED",
      channel: "IN_APP",
      title: "Crédito disponible",
      message: `Tienes un crédito de $${(creditAmount / 100).toFixed(2)} disponible por 90 días.`,
      data: { creditId: credit.id, amount: creditAmount },
    }).catch((err) => logger.error("Error sending credit notification", "CREDIT", err));

    return credit;
  }

  async getActiveCredits(userId: string) {
    const now = new Date();
    return prisma.credit.findMany({
      where: {
        userId,
        status: CreditStatus.ACTIVE,
        expiresAt: { gt: now },
        deletedAt: null,
      },
      orderBy: { expiresAt: "asc" },
    });
  }

  async expireCredits() {
    const now = new Date();
    const result = await prisma.credit.updateMany({
      where: {
        status: CreditStatus.ACTIVE,
        expiresAt: { lt: now },
        deletedAt: null,
      },
      data: { status: CreditStatus.EXPIRED },
    });

    if (result.count > 0) {
      logger.info(`Expired ${result.count} credits`, "CREDIT_CRON");
    }

    return result.count;
  }

  // ==================== CHECKOUT UNIFICADO ====================

  /**
   * Inicia un checkout con el proveedor correcto según el país del cliente.
   * Devuelve: clientSecret (Stripe) | redirectUrl (Tilopay 3DS) + providerRef.
   */
  async initCheckout(data: {
    userId: string;
    userEmail?: string;
    bookingId: string;
    amount?: number;
    currency?: string;
    countryCode?: string;
    description?: string;
    returnUrl?: string;
    metadata?: Record<string, string>;
    captureMode?: 'manual' | 'automatic';
  }) {
    const currency = process.env.DEFAULT_CURRENCY || "USD";

    // Validate booking belongs to user and compute authoritative amount server-side
    const booking = await bookingClient.getBooking(data.bookingId);
    if (!booking) throw new AppError(404, "Reserva no encontrada");
    if (booking.clientId !== data.userId) {
      throw new AppError(403, "No tienes permiso para pagar esta reserva");
    }

    // Compute amount the booking actually owes — ignore client-supplied value
    const remainingAmount = booking.totalPrice - (booking.paidAmount ?? 0);
    const serverAmount = (booking.anticipoRequired && (booking.paymentStatus === 'PENDING' || booking.paymentStatus === 'CONFIRMED') && booking.anticipoAmount)
      ? booking.anticipoAmount
      : remainingAmount;

    if (serverAmount <= 0) {
      throw new AppError(400, 'Esta reserva ya está completamente pagada');
    }

    const { getProvider } = await import("../utils/payment-router");
    const provider = await getProvider(data.countryCode);

    const result = await provider.createCheckout({
      bookingId: data.bookingId,
      amount: serverAmount,
      currency,
      description: data.description,
      userId: data.userId,
      userEmail: data.userEmail,
      returnUrl: data.returnUrl,
      captureMode: data.captureMode || 'manual',
      metadata: {
        bookingId: data.bookingId,
        userId: data.userId,
        ...data.metadata,
      },
    });

    // Persist in DB
    const intentStatus = result.status === "succeeded"
      ? "SUCCEEDED"
      : result.requiresAction
      ? "REQUIRES_ACTION"
      : "CREATED";

    await (prisma as any).paymentIntent.create({
      data: {
        stripePaymentIntentId: result.providerRef,
        userId: data.userId,
        bookingId: data.bookingId,
        amount: serverAmount,
        currency,
        status: intentStatus,
        clientSecret: result.clientSecret,
        description: data.description,
        metadata: { provider: result.provider, ...data.metadata },
      },
    });

    logger.info("Checkout iniciado", "PAYMENT_SERVICE", {
      bookingId: data.bookingId,
      provider: result.provider,
      providerRef: result.providerRef,
      requiresAction: result.requiresAction,
    });

    return result;
  }

  async initTicketCheckout(data: {
    userId: string;
    userEmail?: string;
    purchaseId: string;
    amount: number;
    currency?: string;
    countryCode?: string;
    returnUrl?: string;
  }) {
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "USD";

    // Cap amount to the authoritative purchase total to prevent under-payment manipulation
    const purchase = await bookingClient.getBooking(data.purchaseId).catch(() => null);
    if (purchase && purchase.clientId !== data.userId && (purchase as any).buyerId !== data.userId) {
      throw new AppError(403, 'No tienes permiso para iniciar el pago de esta compra');
    }
    const serverAmount = purchase?.totalPrice != null
      ? Math.min(data.amount, purchase.totalPrice)
      : data.amount;

    const { getProvider } = await import("../utils/payment-router");
    const provider = await getProvider(data.countryCode);

    const result = await provider.createCheckout({
      bookingId: data.purchaseId,
      amount: serverAmount,
      currency,
      userId: data.userId,
      userEmail: data.userEmail,
      returnUrl: data.returnUrl,
      ticketMode: true,
      metadata: {
        purchaseId: data.purchaseId,
        userId: data.userId,
      },
    });

    logger.info("Ticket checkout iniciado", "PAYMENT_SERVICE", {
      purchaseId: data.purchaseId,
      provider: result.provider,
      providerRef: result.providerRef,
      requiresAction: result.requiresAction,
    });

    return result;
  }

  // ==================== HELPERS ====================

  private mapStripeStatusToPaymentIntentStatus(stripeStatus: string): PaymentIntentStatus {
    const statusMap: Record<string, PaymentIntentStatus> = {
      requires_payment_method: "CREATED",
      requires_confirmation: "CREATED",
      requires_action: "REQUIRES_ACTION",
      processing: "PROCESSING",
      succeeded: "SUCCEEDED",
      canceled: "CANCELLED",
      requires_capture: "REQUIRES_CAPTURE",
    };

    return statusMap[stripeStatus] || "FAILED";
  }

  // ==================== CAPTURE / VOID (Auth+Capture flow) ====================

  /**
   * Capturar el pago pre-autorizado de una reserva.
   * Se llama desde booking-service cuando el artista confirma.
   */
  async captureBookingPayment(bookingId: string) {
    const pi = await (prisma as any).paymentIntent.findFirst({
      where: { bookingId, status: "REQUIRES_CAPTURE" },
      orderBy: { createdAt: "desc" },
    });

    if (!pi) {
      throw new AppError(404, `No se encontró un pago pre-autorizado para la reserva ${bookingId}`);
    }

    const provider: string = (pi.metadata as any)?.provider || "STRIPE";
    const orderNumber: string = pi.stripePaymentIntentId;

    logger.info("Iniciando captura de pago pre-autorizado", "PAYMENT_SERVICE", {
      bookingId, provider, orderNumber,
    });

    if (provider === "TILOPAY") {
      const { approved, responseCode } = await (await import("../providers/tilopay.provider")).tilopayProvider.capturePayment(orderNumber);
      if (!approved) {
        throw new AppError(502, `Tilopay capture rechazado: código ${responseCode}`);
      }
    } else {
      await stripeProvider.capturePaymentIntent(orderNumber);
    }

    await (prisma as any).paymentIntent.update({
      where: { id: pi.id },
      data: { status: "SUCCEEDED" },
    });

    await bookingClient.markPayment(bookingId, pi.amount, provider, orderNumber);

    notificationsClient.sendNotification({
      userId: pi.userId,
      type: "PAYMENT_RECEIVED",
      channel: "IN_APP",
      title: "Reserva Confirmada y Pago Procesado",
      message: `Tu artista confirmó la reserva y tu pago de $${(pi.amount / 100).toFixed(2)} fue procesado.`,
      data: { bookingId, amount: pi.amount, currency: pi.currency },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    notificationsClient.sendNotification({
      userId: pi.userId,
      type: "PAYMENT_RECEIVED",
      channel: "PUSH",
      title: "Pago Procesado",
      message: `Tu pago de $${(pi.amount / 100).toFixed(2)} fue procesado correctamente.`,
      data: { bookingId },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    logger.info("Pago capturado exitosamente", "PAYMENT_SERVICE", { bookingId, provider, orderNumber });
  }

  /**
   * Liberar la pre-autorización de una reserva (artista rechazó o expiró).
   * No hubo cobro — solo se libera la retención en la tarjeta del cliente.
   */
  async voidBookingPayment(bookingId: string) {
    const pi = await (prisma as any).paymentIntent.findFirst({
      where: { bookingId, status: "REQUIRES_CAPTURE" },
      orderBy: { createdAt: "desc" },
    });

    if (!pi) {
      logger.warn("voidBookingPayment: no se encontró PI con REQUIRES_CAPTURE", "PAYMENT_SERVICE", { bookingId });
      return;
    }

    const provider: string = (pi.metadata as any)?.provider || "STRIPE";
    const orderNumber: string = pi.stripePaymentIntentId;

    logger.info("Liberando pre-autorización", "PAYMENT_SERVICE", { bookingId, provider, orderNumber });

    if (provider === "TILOPAY") {
      await (await import("../providers/tilopay.provider")).tilopayProvider.voidPayment(orderNumber);
    } else {
      await stripeProvider.cancelPaymentIntent(orderNumber);
    }

    await (prisma as any).paymentIntent.update({
      where: { id: pi.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    notificationsClient.sendNotification({
      userId: pi.userId,
      type: "PAYMENT_CANCELLED",
      channel: "IN_APP",
      title: "Reserva No Confirmada",
      message: "El artista no confirmó tu reserva. No se realizó ningún cobro — la retención en tu tarjeta fue liberada.",
      data: { bookingId },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    notificationsClient.sendNotification({
      userId: pi.userId,
      type: "PAYMENT_CANCELLED",
      channel: "PUSH",
      title: "Sin Cobro",
      message: "La retención en tu tarjeta fue liberada. No se realizó ningún cargo.",
      data: { bookingId },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    logger.info("Pre-autorización liberada", "PAYMENT_SERVICE", { bookingId, provider, orderNumber });
  }

  /**
   * Cobrar el saldo restante de una reserva usando el método de pago guardado del cliente.
   * Llamado por el cron job 72h antes del evento.
   * Usa chargeWithSavedCard() — cobro inmediato, sin pre-autorización.
   */
  async chargeRemainingBalance(bookingId: string): Promise<{ success: boolean; reason?: string }> {
    const booking = await bookingClient.getBooking(bookingId);
    if (!booking) {
      logger.error("chargeRemainingBalance: booking no encontrado", "PAYMENT_SERVICE", { bookingId });
      return { success: false, reason: 'booking_not_found' };
    }

    const remaining = booking.totalPrice - (booking.paidAmount ?? 0);
    if (remaining <= 0) {
      logger.info("chargeRemainingBalance: saldo ya pagado", "PAYMENT_SERVICE", { bookingId });
      return { success: true };
    }

    const defaultMethod = await paymentMethodService.getDefaultPaymentMethod(booking.clientId);
    if (!defaultMethod) {
      logger.info("chargeRemainingBalance: sin método de pago guardado", "PAYMENT_SERVICE", { bookingId, clientId: booking.clientId });
      return { success: false, reason: 'no_saved_method' };
    }

    logger.info("Iniciando cobro automático del saldo restante", "PAYMENT_SERVICE", {
      bookingId, clientId: booking.clientId, remaining, methodId: defaultMethod.id,
    });

    await paymentMethodService.chargeWithSavedCard(
      booking.clientId,
      defaultMethod.id,
      bookingId,
      remaining,
      booking.currency || 'USD',
    );

    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: "PAYMENT_RECEIVED",
      channel: "IN_APP",
      title: "Saldo Restante Cobrado",
      message: `El saldo restante de $${(remaining / 100).toFixed(2)} de tu reserva fue cobrado exitosamente.`,
      data: { bookingId, amount: remaining },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    logger.info("Cobro de saldo restante exitoso", "PAYMENT_SERVICE", { bookingId, remaining });
    return { success: true };
  }

  /**
   * Cobrar el anticipo de una reserva usando el método de pago guardado del cliente.
   * Llamado cuando el artista confirma una reserva que quedó en PENDING (cliente con tarjeta guardada).
   */
  async chargeDepositWithSavedCard(bookingId: string): Promise<{ success: boolean; reason?: string }> {
    const booking = await bookingClient.getBooking(bookingId);
    if (!booking) {
      logger.error("chargeDepositWithSavedCard: booking no encontrado", "PAYMENT_SERVICE", { bookingId });
      return { success: false, reason: 'booking_not_found' };
    }

    const amountToCharge = booking.anticipoRequired && (booking as any).anticipoAmount > 0
      ? (booking as any).anticipoAmount
      : booking.totalPrice;

    if ((booking.paidAmount ?? 0) >= amountToCharge) {
      logger.info("chargeDepositWithSavedCard: anticipo ya pagado", "PAYMENT_SERVICE", { bookingId });
      return { success: true };
    }

    const defaultMethod = await paymentMethodService.getDefaultPaymentMethod(booking.clientId);
    if (!defaultMethod) {
      logger.warn("chargeDepositWithSavedCard: sin método de pago guardado", "PAYMENT_SERVICE", { bookingId, clientId: booking.clientId });
      return { success: false, reason: 'no_saved_method' };
    }

    logger.info("Iniciando cobro de anticipo post-confirmación con tarjeta guardada", "PAYMENT_SERVICE", {
      bookingId, clientId: booking.clientId, amountToCharge, methodId: defaultMethod.id,
    });

    await paymentMethodService.chargeWithSavedCard(
      booking.clientId,
      defaultMethod.id,
      bookingId,
      amountToCharge,
      booking.currency || 'USD',
    );

    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: "PAYMENT_RECEIVED",
      channel: "IN_APP",
      title: "Anticipo Cobrado",
      message: `Tu anticipo de $${(amountToCharge / 100).toFixed(2)} fue cobrado exitosamente.`,
      data: { bookingId, amount: amountToCharge },
      priority: "high",
      category: "payment",
    }).catch(() => {});

    logger.info("Cobro de anticipo post-confirmación exitoso", "PAYMENT_SERVICE", { bookingId, amountToCharge });
    return { success: true };
  }

  private mapStripeRefundStatus(stripeStatus: string): RefundStatus {
    const statusMap: Record<string, RefundStatus> = {
      pending: "PENDING",
      succeeded: "SUCCEEDED",
      failed: "FAILED",
      canceled: "CANCELLED",
    };

    return statusMap[stripeStatus] || "PENDING";
  }

  async confirmTilopayRedirect(data: {
    bookingId: string;
    responseCode: string;
    orderNumber: string;
    auth?: string;
    amount: string;
    currency: string;
    orderHash?: string;
    external_orden_id?: string;
    cardHash?: string;
    cardBrand?: string;
    cardLast4?: string;
    userId: string;
  }) {
    // Tilopay uses "1" in redirect URL params, "00" in server-side webhooks
    const approved = data.responseCode === '00' || data.responseCode === '1';

    if (!approved) {
      logger.warn("Tilopay redirect: pago no aprobado", "PAYMENT_SERVICE", {
        bookingId: data.bookingId,
        responseCode: data.responseCode,
      });
      return { success: false, responseCode: data.responseCode };
    }

    // Verificar que no se haya procesado ya este orderNumber
    const existing = await (prisma as any).paymentIntent.findFirst({
      where: { stripePaymentIntentId: data.orderNumber },
    }).catch(() => null);

    if (!existing) {
      // Ignore URL-provided amount — derive authoritative amount from server-side booking record
      const booking = await bookingClient.getBooking(data.bookingId);
      if (!booking) {
        logger.error("Tilopay redirect: booking not found", "PAYMENT_SERVICE", { bookingId: data.bookingId });
        return { success: false, responseCode: data.responseCode };
      }
      if (booking.clientId !== data.userId) {
        logger.error("Tilopay redirect: ownership check failed", "PAYMENT_SERVICE", { bookingId: data.bookingId, userId: data.userId });
        throw new AppError(403, 'No tienes permiso para confirmar este pago');
      }
      const isAnticipo = booking.anticipoRequired &&
        ['PENDING', 'CONFIRMED'].includes(booking.paymentStatus) &&
        booking.anticipoAmount > 0;
      const amountCents = isAnticipo
        ? booking.anticipoAmount
        : Math.max(0, booking.totalPrice - (booking.paidAmount || 0));

      // PI en estado REQUIRES_CAPTURE: la tarjeta está pre-autorizada (capture='0')
      // pero aún no cobrada. El cobro se hará cuando el artista confirme.
      await (prisma as any).paymentIntent.create({
        data: {
          stripePaymentIntentId: data.orderNumber,
          userId: data.userId,
          bookingId: data.bookingId,
          amount: amountCents,
          currency: data.currency,
          status: "REQUIRES_CAPTURE",
          metadata: { provider: "TILOPAY", auth: data.auth, captureMode: "MANUAL" },
        },
      });

      // Marcar la tarjeta como pre-autorizada en el booking (no como pagado aún)
      const cardAuthorized = await bookingClient.markCardAuthorized(
        data.bookingId,
        data.orderNumber,
      );
      if (!cardAuthorized) {
        logger.error(
          "RECONCILIATION_NEEDED: Tilopay markCardAuthorized falló tras pre-auth",
          "PAYMENT_SERVICE",
          {
            bookingId: data.bookingId,
            orderNumber: data.orderNumber,
            amountCents,
            userId: data.userId,
          }
        );
      }

      // Guardar token de tarjeta para futuros cobros con un toque
      if (data.cardHash) {
        paymentMethodService.saveProviderToken(data.userId, {
          provider: 'TILOPAY',
          token: data.cardHash,
          cardBrand: data.cardBrand,
          cardLast4: data.cardLast4,
        }).catch((e: any) =>
          logger.warn("Error guardando token de tarjeta Tilopay", "PAYMENT_SERVICE", { error: e.message })
        );
      }

      logger.info("Tilopay redirect: tarjeta pre-autorizada (REQUIRES_CAPTURE)", "PAYMENT_SERVICE", {
        bookingId: data.bookingId,
        orderNumber: data.orderNumber,
        amountCents,
        cardSaved: !!data.cardHash,
      });
    } else {
      logger.info("Tilopay redirect: pago ya procesado (idempotente)", "PAYMENT_SERVICE", {
        bookingId: data.bookingId,
        orderNumber: data.orderNumber,
      });
    }

    return { success: true, responseCode: data.responseCode };
  }
}

export const paymentService = new PaymentService();
