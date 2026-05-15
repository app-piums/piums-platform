import { PrismaClient, PaymentStatus, PaymentType, PaymentIntentStatus, RefundStatus, CreditStatus } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";
import { bookingClient } from "../clients/booking.client";
import { notificationsClient } from "../clients/notifications.client";
import { PaymentMethodService } from "./paymentMethod.service";

const paymentMethodService = new PaymentMethodService();

const prisma = new PrismaClient();

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
      await bookingClient.markPayment(
        payment.bookingId,
        payment.amount,
        payment.paymentMethod || undefined,
        payment.stripePaymentIntentId || undefined,
        payment.paymentType === "DEPOSIT" ? "DEPOSIT" : "FULL_PAYMENT"
      );
    }

    // Enviar notificación
    notificationsClient
      .sendNotification({
        userId: payment.userId,
        type: "PAYMENT_RECEIVED",
        channel: "IN_APP",
        title: "Pago Recibido",
        message: `Tu pago de $${(payment.amount / 100).toFixed(2)} ${payment.currency} ha sido procesado exitosamente`,
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
    // Buscar pago
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { refunds: true },
    });

    if (!payment) {
      throw new AppError(404, "Pago no encontrado");
    }

    if (payment.userId !== data.requestedBy) {
      throw new AppError(403, "No tienes permiso para reembolsar este pago");
    }

    if (payment.status !== "SUCCEEDED") {
      throw new AppError(400, "Solo se pueden reembolsar pagos exitosos");
    }

    // Calcular monto disponible para reembolso
    const refundedAmount = payment.refunds
      .filter((r) => r.status === "SUCCEEDED")
      .reduce((sum, r) => sum + r.amount, 0);

    const availableForRefund = payment.amount - refundedAmount;

    if (availableForRefund <= 0) {
      throw new AppError(400, "Este pago ya ha sido reembolsado completamente");
    }

    const refundAmount = data.amount
      ? Math.min(data.amount, availableForRefund)
      : availableForRefund;

    // Crear refund en Stripe
    const stripeRefund = await stripeProvider.createRefund({
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

    // Registrar refund
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        stripeRefundId: stripeRefund.id,
        requestedBy: data.requestedBy,
        amount: refundAmount,
        currency: payment.currency,
        status: this.mapStripeRefundStatus(stripeRefund.status ?? 'pending'),
        reason: data.reason,
        metadata: data.metadata,
        processedAt: stripeRefund.status === "succeeded" ? new Date() : undefined,
      },
    });

    // Actualizar estado del pago
    const newRefundedAmount = refundedAmount + refundAmount;
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
        message: `Se ha procesado un reembolso de $${(refundAmount / 100).toFixed(2)} ${payment.currency}`,
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
      byStatus: statusBreakdown.map((s) => ({
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
      message: `Tienes un crédito de $${(creditAmount / 100).toFixed(2)} USD disponible por 90 días.`,
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
    amount: number;
    currency?: string;
    countryCode?: string;
    description?: string;
    returnUrl?: string;
    metadata?: Record<string, string>;
  }) {
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "USD";

    // Validate booking belongs to user
    if (data.bookingId) {
      const booking = await bookingClient.getBooking(data.bookingId);
      if (!booking) throw new AppError(404, "Reserva no encontrada");
      if (booking.clientId !== data.userId) {
        throw new AppError(403, "No tienes permiso para pagar esta reserva");
      }
    }

    const { getProvider } = await import("../utils/payment-router");
    const provider = await getProvider(data.countryCode);

    const result = await provider.createCheckout({
      bookingId: data.bookingId,
      amount: data.amount,
      currency,
      description: data.description,
      userId: data.userId,
      userEmail: data.userEmail,
      returnUrl: data.returnUrl,
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
        amount: data.amount,
        currency,
        status: intentStatus,
        clientSecret: result.clientSecret,
        description: data.description,
        metadata: { provider: result.provider, ...data.metadata },
      },
    }).catch((err: any) => {
      logger.error("Error guardando paymentIntent en DB", "PAYMENT_SERVICE", { error: err.message });
    });

    logger.info("Checkout iniciado", "PAYMENT_SERVICE", {
      bookingId: data.bookingId,
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
      requires_capture: "PROCESSING",
    };

    return statusMap[stripeStatus] || "FAILED";
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

    const rawAmount = parseFloat(data.amount);
    const amountCents = isNaN(rawAmount) ? 0 : Math.round(rawAmount * 100);

    // Verificar que no se haya procesado ya este orderNumber
    const existing = await (prisma as any).paymentIntent.findFirst({
      where: { stripePaymentIntentId: data.orderNumber },
    }).catch(() => null);

    if (!existing) {
      await (prisma as any).paymentIntent.create({
        data: {
          stripePaymentIntentId: data.orderNumber,
          userId: data.userId,
          bookingId: data.bookingId,
          amount: amountCents,
          currency: data.currency,
          status: "SUCCEEDED",
          metadata: { provider: "TILOPAY", auth: data.auth },
        },
      }).catch((err: any) =>
        logger.error("Error guardando paymentIntent Tilopay", "PAYMENT_SERVICE", { error: err.message })
      );

      // No pasar paymentType — booking-service determina ANTICIPO_PAID vs FULLY_PAID
      // comparando el monto contra anticipoAmount / totalPrice del booking.
      await bookingClient.markPayment(
        data.bookingId,
        amountCents,
        "TILOPAY",
        data.orderNumber,
      );

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

      logger.info("Tilopay redirect: pago confirmado", "PAYMENT_SERVICE", {
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
