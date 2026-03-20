import { PrismaClient, PayoutStatus, PayoutType } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { stripeProvider } from "../providers/stripe.provider";
import { artistsClient } from "../clients/artists.client";
import { bookingClient } from "../clients/booking.client";

const prisma = new PrismaClient();

// Configuración de fees (debería estar en variables de entorno o config)
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "15"); // 15%

export class PayoutService {
  // ==================== CREATE PAYOUT ====================

  /**
   * Crear un payout pendiente
   */
  async createPayout(data: {
    artistId: string;
    bookingId?: string;
    paymentId?: string;
    amount: number;
    currency?: string;
    payoutType?: PayoutType;
    description?: string;
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }) {
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "GTQ";

    // Validar que el artista existe
    const artist = await artistsClient.getArtist(data.artistId);
    if (!artist) {
      throw new AppError(404, "Artista no encontrado");
    }

    // Si hay bookingId, validar
    if (data.bookingId) {
      const booking = await bookingClient.getBooking(data.bookingId);
      if (!booking) {
        throw new AppError(404, "Reserva no encontrada");
      }
      if (booking.artistId !== data.artistId) {
        throw new AppError(400, "La reserva no pertenece a este artista");
      }
    }

    // Calcular fees si es BOOKING_PAYMENT
    let platformFee = 0;
    let originalAmount = data.amount;

    if (data.payoutType === "BOOKING_PAYMENT" || !data.payoutType) {
      platformFee = Math.round((data.amount * PLATFORM_FEE_PERCENTAGE) / 100);
    }

    // Crear payout en base de datos
    const payout = await prisma.payout.create({
      data: {
        artistId: data.artistId,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        amount: data.amount,
        currency,
        status: data.scheduledFor ? "SCHEDULED" : "PENDING",
        payoutType: data.payoutType || "BOOKING_PAYMENT",
        originalAmount,
        platformFee,
        scheduledFor: data.scheduledFor,
        description: data.description,
        metadata: data.metadata,
      },
    });

    logger.info("Payout creado", "PAYOUT_SERVICE", {
      payoutId: payout.id,
      artistId: data.artistId,
      amount: data.amount,
      status: payout.status,
    });

    return payout;
  }

  // ==================== PROCESS PAYOUT ====================

  /**
   * Procesar un payout (hacer la transferencia a Stripe Connect)
   */
  async processPayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError(404, "Payout no encontrado");
    }

    if (payout.status !== "PENDING" && payout.status !== "SCHEDULED") {
      throw new AppError(400, `No se puede procesar un payout con estado: ${payout.status}`);
    }

    // Verificar si está programado para el futuro
    if (payout.scheduledFor && payout.scheduledFor > new Date()) {
      throw new AppError(400, "El payout está programado para una fecha futura");
    }

    // Obtener cuenta Stripe Connect del artista
    const stripeAccount = await artistsClient.getStripeConnectAccount(payout.artistId);
    if (!stripeAccount || !stripeAccount.stripeAccountId) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: "NO_STRIPE_ACCOUNT",
          failureMessage: "El artista no tiene cuenta Stripe Connect configurada",
        },
      });
      throw new AppError(400, "El artista no tiene cuenta Stripe Connect");
    }

    if (!stripeAccount.canReceivePayouts) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: "ACCOUNT_NOT_READY",
          failureMessage: "La cuenta Stripe Connect no está lista para recibir pagos",
        },
      });
      throw new AppError(400, "La cuenta del artista no está lista para recibir pagos");
    }

    // Actualizar estado a PROCESSING
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: "PROCESSING" },
    });

    try {
      // Crear transfer en Stripe
      const transfer = await stripeProvider.createTransfer({
        amount: payout.amount,
        currency: payout.currency,
        destination: stripeAccount.stripeAccountId,
        description: payout.description || `Pago a artista - ${payout.id}`,
        metadata: {
          payoutId: payout.id,
          artistId: payout.artistId,
          ...(payout.bookingId && { bookingId: payout.bookingId }),
          ...(payout.metadata as Record<string, string>),
        },
      });

      // Actualizar payout con información del transfer
      const updatedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "IN_TRANSIT",
          stripeTransferId: transfer.id,
          stripeAccountId: stripeAccount.stripeAccountId,
          processedAt: new Date(),
        },
      });

      logger.info("Payout procesado", "PAYOUT_SERVICE", {
        payoutId: payout.id,
        transferId: transfer.id,
        amount: payout.amount,
      });

      return updatedPayout;
    } catch (error: any) {
      // Marcar como fallido
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: error.code || "STRIPE_ERROR",
          failureMessage: error.message || "Error al procesar payout",
        },
      });

      logger.error("Error procesando payout", "PAYOUT_SERVICE", {
        payoutId: payout.id,
        error: error.message,
      });

      throw new AppError(500, `Error al procesar payout: ${error.message}`);
    }
  }

  // ==================== GET PAYOUT ====================

  /**
   * Obtener payout por ID
   */
  async getPayoutById(id: string) {
    const payout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new AppError(404, "Payout no encontrado");
    }

    return payout;
  }

  // ==================== LIST PAYOUTS ====================

  /**
   * Listar payouts con filtros
   */
  async listPayouts(filters: {
    artistId?: string;
    bookingId?: string;
    status?: PayoutStatus;
    payoutType?: PayoutType;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.status) where.status = filters.status;
    if (filters.payoutType) where.payoutType = filters.payoutType;
    
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== GET ARTIST PAYOUTS ====================

  /**
   * Obtener payouts de un artista
   */
  async getArtistPayouts(artistId: string, filters?: {
    status?: PayoutStatus;
    fromDate?: Date;
    toDate?: Date;
  }) {
    return this.listPayouts({
      artistId,
      ...filters,
    });
  }

  // ==================== CANCEL PAYOUT ====================

  /**
   * Cancelar un payout pendiente
   */
  async cancelPayout(payoutId: string, reason?: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError(404, "Payout no encontrado");
    }

    if (payout.status !== "PENDING" && payout.status !== "SCHEDULED") {
      throw new AppError(400, `No se puede cancelar un payout con estado: ${payout.status}`);
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "CANCELLED",
        internalNotes: reason,
      },
    });

    logger.info("Payout cancelado", "PAYOUT_SERVICE", {
      payoutId: payoutId,
      reason,
    });

    return updatedPayout;
  }

  // ==================== CALCULATE PAYOUT ====================

  /**
   * Calcular monto de payout después de fees
   */
  calculatePayoutAmount(originalAmount: number, payoutType: PayoutType = "BOOKING_PAYMENT") {
    let platformFee = 0;
    let stripeFee = 0;

    if (payoutType === "BOOKING_PAYMENT") {
      // Fee de plataforma
      platformFee = Math.round((originalAmount * PLATFORM_FEE_PERCENTAGE) / 100);
      
      // Fee de Stripe (aproximado: 2.9% + Q3 GTQ)
      // Nota: Este es un ejemplo, los fees reales dependen del plan de Stripe
      stripeFee = Math.round((originalAmount * 2.9) / 100 + 300);
    }

    const netAmount = originalAmount - platformFee - stripeFee;

    return {
      originalAmount,
      platformFee,
      stripeFee,
      netAmount,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    };
  }

  // ==================== STATS ====================

  /**
   * Obtener estadísticas de payouts de un artista
   */
  async getArtistPayoutStats(artistId: string) {
    const where = { artistId, deletedAt: null };

    const [
      totalCount,
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      totalAmount,
      completedAmount,
    ] = await Promise.all([
      prisma.payout.count({ where }),
      prisma.payout.count({ where: { ...where, status: "PENDING" } }),
      prisma.payout.count({
        where: {
          ...where,
          status: { in: ["PROCESSING", "IN_TRANSIT"] },
        },
      }),
      prisma.payout.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.payout.count({ where: { ...where, status: "FAILED" } }),
      prisma.payout.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    return {
      total: totalCount,
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      totalAmount: totalAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
    };
  }

  // ==================== SYNC STRIPE STATUS ====================

  /**
   * Sincronizar estado de payout con Stripe
   */
  async syncPayoutStatus(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError(404, "Payout no encontrado");
    }

    if (!payout.stripeTransferId) {
      throw new AppError(400, "Payout no tiene transfer en Stripe");
    }

    try {
      const transfer = await stripeProvider.retrieveTransfer(
        payout.stripeTransferId
      );

      // Mapear estado de Stripe a nuestro estado
      let status: PayoutStatus = payout.status;
      if (transfer.reversed) {
        status = "REVERSED";
      } else if (transfer.amount > 0) {
        // Si el transfer tiene monto, asumimos que fue exitoso
        status = "COMPLETED";
      }

      const updatedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: { status },
      });

      return updatedPayout;
    } catch (error: any) {
      logger.error("Error sincronizando payout con Stripe", "PAYOUT_SERVICE", {
        payoutId,
        error: error.message,
      });
      throw error;
    }
  }
}

export const payoutService = new PayoutService();
