import { PrismaClient, PaymentStatus, PaymentType, PaymentIntentStatus, RefundStatus } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";
import { bookingClient } from "../clients/booking.client";
import { notificationsClient } from "../clients/notifications.client";

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
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "GTQ";

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
  async getRefundById(id: string) {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new AppError(404, "Reembolso no encontrado");
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
}

export const paymentService = new PaymentService();
