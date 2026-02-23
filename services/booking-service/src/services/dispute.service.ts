import { PrismaClient, DisputeType, DisputeStatus, DisputeResolution } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class DisputeService {
  // ==================== CREATE DISPUTE ====================

  /**
   * Crear una nueva disputa
   */
  async createDispute(data: {
    bookingId: string;
    reportedBy: string;
    reportedAgainst?: string;
    disputeType: DisputeType;
    subject: string;
    description: string;
    evidence?: Record<string, any>;
    priority?: number;
  }) {
    // Validar que la reserva existe
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new AppError(404, "Reserva no encontrada");
    }

    // Crear disputa
    const dispute = await prisma.dispute.create({
      data: {
        bookingId: data.bookingId,
        reportedBy: data.reportedBy,
        reportedAgainst: data.reportedAgainst,
        disputeType: data.disputeType,
        status: "OPEN",
        subject: data.subject,
        description: data.description,
        evidence: data.evidence,
        priority: data.priority || 0,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    logger.info("Disputa creada", "DISPUTE_SERVICE", {
      disputeId: dispute.id,
      bookingId: data.bookingId,
      disputeType: data.disputeType,
      reportedBy: data.reportedBy,
    });

    return dispute;
  }

  // ==================== GET DISPUTE ====================

  /**
   * Obtener disputa por ID
   */
  async getDisputeById(id: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    return dispute;
  }

  // ==================== LIST DISPUTES ====================

  /**
   * Listar disputas con filtros
   */
  async listDisputes(filters: {
    bookingId?: string;
    reportedBy?: string;
    reportedAgainst?: string;
    disputeType?: DisputeType;
    status?: DisputeStatus;
    priority?: number;
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

    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.reportedBy) where.reportedBy = filters.reportedBy;
    if (filters.reportedAgainst) where.reportedAgainst = filters.reportedAgainst;
    if (filters.disputeType) where.disputeType = filters.disputeType;
    if (filters.status) where.status = filters.status;
    if (filters.priority !== undefined) where.priority = filters.priority;

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: "desc" }, // Prioridad alta primero
          { createdAt: "desc" },
        ],
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // Solo el último mensaje
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== UPDATE DISPUTE STATUS ====================

  /**
   * Actualizar estado de una disputa
   */
  async updateDisputeStatus(
    disputeId: string,
    status: DisputeStatus,
    staffId: string,
    notes?: string
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    const oldStatus = dispute.status;

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: { status },
    });

    // Crear mensaje de actualización de estado
    await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: staffId,
        senderType: "staff",
        message: notes || `Estado cambiado de ${oldStatus} a ${status}`,
        isStatusUpdate: true,
        oldStatus,
        newStatus: status,
      },
    });

    logger.info("Estado de disputa actualizado", "DISPUTE_SERVICE", {
      disputeId,
      oldStatus,
      newStatus: status,
      staffId,
    });

    return updated;
  }

  // ==================== RESOLVE DISPUTE ====================

  /**
   * Resolver una disputa
   */
  async resolveDispute(data: {
    disputeId: string;
    resolution: DisputeResolution;
    resolutionNotes: string;
    resolvedBy: string;
    refundAmount?: number;
  }) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: data.disputeId },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
      throw new AppError(400, "La disputa ya está resuelta o cerrada");
    }

    const resolved = await prisma.dispute.update({
      where: { id: data.disputeId },
      data: {
        status: "RESOLVED",
        resolution: data.resolution,
        resolutionNotes: data.resolutionNotes,
        resolvedBy: data.resolvedBy,
        resolvedAt: new Date(),
        refundAmount: data.refundAmount,
        refundIssued: !!data.refundAmount,
        refundIssuedAt: data.refundAmount ? new Date() : undefined,
      },
    });

    // Crear mensaje de resolución
    await prisma.disputeMessage.create({
      data: {
        disputeId: data.disputeId,
        senderId: data.resolvedBy,
        senderType: "staff",
        message: `Disputa resuelta: ${data.resolution}\n\n${data.resolutionNotes}`,
        isStatusUpdate: true,
        oldStatus: dispute.status,
        newStatus: "RESOLVED",
      },
    });

    logger.info("Disputa resuelta", "DISPUTE_SERVICE", {
      disputeId: data.disputeId,
      resolution: data.resolution,
      refundAmount: data.refundAmount,
      resolvedBy: data.resolvedBy,
    });

    return resolved;
  }

  // ==================== ADD MESSAGE ====================

  /**
   * Agregar mensaje a una disputa
   */
  async addMessage(data: {
    disputeId: string;
    senderId: string;
    senderType: "client" | "artist" | "staff";
    message: string;
    attachments?: Record<string, any>;
  }) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: data.disputeId },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    const message = await prisma.disputeMessage.create({
      data: {
        disputeId: data.disputeId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        attachments: data.attachments,
      },
    });

    logger.info("Mensaje agregado a disputa", "DISPUTE_SERVICE", {
      disputeId: data.disputeId,
      senderId: data.senderId,
      senderType: data.senderType,
    });

    return message;
  }

  // ==================== ESCALATE DISPUTE ====================

  /**
   * Escalar una disputa a prioridad alta
   */
  async escalateDispute(disputeId: string, staffId: string, reason: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    const escalated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "ESCALATED",
        priority: 2, // Urgente
      },
    });

    // Crear mensaje de escalamiento
    await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: staffId,
        senderType: "staff",
        message: `Disputa escalada a prioridad urgente.\nRazón: ${reason}`,
        isStatusUpdate: true,
        oldStatus: dispute.status,
        newStatus: "ESCALATED",
      },
    });

    logger.warn("Disputa escalada", "DISPUTE_SERVICE", {
      disputeId,
      reason,
      staffId,
    });

    return escalated;
  }

  // ==================== CLOSE DISPUTE ====================

  /**
   * Cerrar una disputa sin resolución
   */
  async closeDispute(disputeId: string, staffId: string, reason: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new AppError(404, "Disputa no encontrada");
    }

    const closed = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "CLOSED",
      },
    });

    // Crear mensaje de cierre
    await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: staffId,
        senderType: "staff",
        message: `Disputa cerrada.\nRazón: ${reason}`,
        isStatusUpdate: true,
        oldStatus: dispute.status,
        newStatus: "CLOSED",
      },
    });

    logger.info("Disputa cerrada", "DISPUTE_SERVICE", {
      disputeId,
      reason,
      staffId,
    });

    return closed;
  }

  // ==================== STATS ====================

  /**
   * Obtener estadísticas de disputas
   */
  async getDisputeStats(filters?: {
    reportedBy?: string;
    reportedAgainst?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = { deletedAt: null };

    if (filters?.reportedBy) where.reportedBy = filters.reportedBy;
    if (filters?.reportedAgainst) where.reportedAgainst = filters.reportedAgainst;

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [
      totalCount,
      openCount,
      inReviewCount,
      resolvedCount,
      closedCount,
      escalatedCount,
      byType,
      byResolution,
    ] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.count({ where: { ...where, status: "OPEN" } }),
      prisma.dispute.count({ where: { ...where, status: "IN_REVIEW" } }),
      prisma.dispute.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.dispute.count({ where: { ...where, status: "CLOSED" } }),
      prisma.dispute.count({ where: { ...where, status: "ESCALATED" } }),
      prisma.dispute.groupBy({
        by: ["disputeType"],
        where,
        _count: true,
      }),
      prisma.dispute.groupBy({
        by: ["resolution"],
        where: { ...where, resolution: { not: null } },
        _count: true,
      }),
    ]);

    return {
      total: totalCount,
      open: openCount,
      inReview: inReviewCount,
      resolved: resolvedCount,
      closed: closedCount,
      escalated: escalatedCount,
      byType: byType.map((t: any) => ({
        type: t.disputeType,
        count: t._count,
      })),
      byResolution: byResolution.map((r: any) => ({
        resolution: r.resolution,
        count: r._count,
      })),
    };
  }

  // ==================== GET USER DISPUTES ====================

  /**
   * Obtener disputas de un usuario (como reportante o reportado)
   */
  async getUserDisputes(userId: string) {
    const [asReporter, asReported] = await Promise.all([
      prisma.dispute.findMany({
        where: {
          reportedBy: userId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.dispute.findMany({
        where: {
          reportedAgainst: userId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      asReporter,
      asReported,
      total: asReporter.length + asReported.length,
    };
  }
}

export const disputeService = new DisputeService();
