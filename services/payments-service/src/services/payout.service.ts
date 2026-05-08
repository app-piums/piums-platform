import { PrismaClient, PayoutStatus, PayoutType } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { bookingClient } from "../clients/booking.client";

const prisma = new PrismaClient();

const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "18");

export class PayoutService {
  // ==================== CREATE PAYOUT ====================

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
    const currency = data.currency || process.env.DEFAULT_CURRENCY || "USD";

    if (data.bookingId) {
      const booking = await bookingClient.getBooking(data.bookingId);
      if (!booking) throw new AppError(404, "Reserva no encontrada");
      if (booking.artistId !== data.artistId) {
        throw new AppError(400, "La reserva no pertenece a este artista");
      }
    }

    // Calcular fee — busca CommissionRule específica del artista o del booking,
    // cae al porcentaje global de la plataforma si no existe regla activa.
    let platformFeePercentage = PLATFORM_FEE_PERCENTAGE;
    let platformFee = 0;

    if (data.payoutType === "BOOKING_PAYMENT" || !data.payoutType) {
      // Buscar regla de comisión activa para el artista
      const commissionRule = await (prisma as any).commissionRule.findFirst({
        where: {
          artistId: data.artistId,
          isActive: true,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => null);

      if (commissionRule) {
        if (commissionRule.type === "FIXED_PENALTY") {
          platformFee = commissionRule.fixedAmount ?? 0;
        } else if (commissionRule.type === "RATE_OVERRIDE") {
          platformFeePercentage = commissionRule.rate ?? platformFeePercentage;
          platformFee = Math.round((data.amount * platformFeePercentage) / 100);
        } else {
          platformFee = Math.round((data.amount * platformFeePercentage) / 100);
        }

        // Regla de un solo uso: desactivar tras aplicarse
        if (commissionRule.isOneTime) {
          await (prisma as any).commissionRule.update({
            where: { id: commissionRule.id },
            data: { isActive: false, appliedAt: new Date() },
          }).catch(() => null);
        }
      } else {
        platformFee = Math.round((data.amount * platformFeePercentage) / 100);
      }
    }

    const payout = await (prisma as any).payout.create({
      data: {
        artistId: data.artistId,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        amount: data.amount,
        currency,
        status: data.scheduledFor ? "SCHEDULED" : "PENDING",
        payoutType: data.payoutType || "BOOKING_PAYMENT",
        originalAmount: data.amount,
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
      platformFee,
      status: payout.status,
    });

    return payout;
  }

  // ==================== PROCESS PAYOUT ====================
  // Los pagos a artistas se completan manualmente por el admin (sin Stripe Connect).
  // Este método marca el payout como PROCESSING, luego el admin llama a completePayout().

  async processPayout(payoutId: string) {
    const payout = await (prisma as any).payout.findUnique({ where: { id: payoutId } });

    if (!payout) throw new AppError(404, "Payout no encontrado");

    if (payout.status !== "PENDING" && payout.status !== "SCHEDULED") {
      throw new AppError(400, `No se puede procesar un payout con estado: ${payout.status}`);
    }

    if (payout.scheduledFor && payout.scheduledFor > new Date()) {
      throw new AppError(400, "El payout está programado para una fecha futura");
    }

    const updated = await (prisma as any).payout.update({
      where: { id: payoutId },
      data: { status: "PROCESSING" },
    });

    logger.info("Payout marcado PROCESSING — requiere acción manual del admin", "PAYOUT_SERVICE", {
      payoutId,
    });

    return updated;
  }

  // ==================== COMPLETE PAYOUT (admin manual) ====================

  async completePayout(
    payoutId: string,
    transferReference: string,
    completedByAdmin?: string,
  ) {
    const payout = await (prisma as any).payout.findUnique({ where: { id: payoutId } });

    if (!payout) throw new AppError(404, "Payout no encontrado");

    if (!["PENDING", "PROCESSING", "SCHEDULED"].includes(payout.status)) {
      throw new AppError(400, `No se puede completar un payout con estado: ${payout.status}`);
    }

    const updated = await (prisma as any).payout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        transferReference,
        completedByAdmin: completedByAdmin ?? null,
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });

    logger.info("Payout completado manualmente", "PAYOUT_SERVICE", {
      payoutId,
      transferReference,
      completedByAdmin,
    });

    return updated;
  }

  // ==================== GET PAYOUT ====================

  async getPayoutById(id: string) {
    const payout = await (prisma as any).payout.findUnique({ where: { id } });
    if (!payout) throw new AppError(404, "Payout no encontrado");
    return payout;
  }

  // ==================== LIST PAYOUTS ====================

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

    const where: any = { deletedAt: null };

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
      (prisma as any).payout.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      (prisma as any).payout.count({ where }),
    ]);

    return {
      payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ==================== PENDING PAYOUTS (admin) ====================

  async getPendingPayouts(page = 1, limit = 50) {
    return this.listPayouts({ status: "PENDING" as PayoutStatus, page, limit });
  }

  // ==================== ARTIST PAYOUTS ====================

  async getArtistPayouts(artistId: string, filters?: {
    status?: PayoutStatus;
    fromDate?: Date;
    toDate?: Date;
  }) {
    return this.listPayouts({ artistId, ...filters });
  }

  // ==================== CANCEL PAYOUT ====================

  async cancelPayout(payoutId: string, reason?: string) {
    const payout = await (prisma as any).payout.findUnique({ where: { id: payoutId } });

    if (!payout) throw new AppError(404, "Payout no encontrado");

    if (payout.status !== "PENDING" && payout.status !== "SCHEDULED") {
      throw new AppError(400, `No se puede cancelar un payout con estado: ${payout.status}`);
    }

    const updated = await (prisma as any).payout.update({
      where: { id: payoutId },
      data: { status: "CANCELLED", internalNotes: reason },
    });

    logger.info("Payout cancelado", "PAYOUT_SERVICE", { payoutId, reason });
    return updated;
  }

  // ==================== CALCULATE PAYOUT ====================

  calculatePayoutAmount(originalAmount: number, payoutType: PayoutType = "BOOKING_PAYMENT") {
    let platformFee = 0;

    if (payoutType === "BOOKING_PAYMENT") {
      platformFee = Math.round((originalAmount * PLATFORM_FEE_PERCENTAGE) / 100);
    }

    return {
      originalAmount,
      platformFee,
      netAmount: originalAmount - platformFee,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    };
  }

  // ==================== STATS ====================

  async getArtistPayoutStats(artistId: string) {
    const where = { artistId, deletedAt: null };

    const [
      totalCount, pendingCount, processingCount,
      completedCount, failedCount,
      totalAmount, completedAmount,
    ] = await Promise.all([
      (prisma as any).payout.count({ where }),
      (prisma as any).payout.count({ where: { ...where, status: "PENDING" } }),
      (prisma as any).payout.count({ where: { ...where, status: { in: ["PROCESSING", "IN_TRANSIT"] } } }),
      (prisma as any).payout.count({ where: { ...where, status: "COMPLETED" } }),
      (prisma as any).payout.count({ where: { ...where, status: "FAILED" } }),
      (prisma as any).payout.aggregate({ where, _sum: { amount: true } }),
      (prisma as any).payout.aggregate({ where: { ...where, status: "COMPLETED" }, _sum: { amount: true } }),
    ]);

    return {
      total: totalCount,
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      totalAmount: totalAmount._sum?.amount ?? 0,
      completedAmount: completedAmount._sum?.amount ?? 0,
    };
  }
}

export const payoutService = new PayoutService();
