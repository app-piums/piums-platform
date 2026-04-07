import { PrismaClient, ReviewStatus, ReportReason } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { bookingClient } from "../clients/booking.client";
import { notificationsClient } from "../clients/notifications.client";

const prisma = new PrismaClient();

export class ReviewService {
  // ==================== REVIEWS ====================

  /**
   * Crear una nueva reseña
   */
  async createReview(data: {
    bookingId: string;
    clientId: string;
    rating: number;
    comment?: string;
    photos?: Array<{ url: string; caption?: string }>;
  }) {
    // Verificar que el booking existe y pertenece al cliente
    const booking = await bookingClient.getBooking(data.bookingId, data.clientId);
    
    if (!booking) {
      throw new AppError(404, "Booking no encontrado");
    }

    // Verificar que el booking esté en un estado que permita reseña
    // Permitimos CONFIRMED, ACCEPTED (según UI) y COMPLETED
    const allowedStatuses = ["CONFIRMED", "ACCEPTED", "PAYMENT_COMPLETED", "COMPLETED"];
    if (!allowedStatuses.includes(booking.status)) {
      throw new AppError(400, `Solo puedes dejar una reseña en reservas confirmadas o completadas (Estado actual: ${booking.status})`);
    }

    // Verificar que el booking pertenezca al cliente
    if (booking.clientId !== data.clientId) {
      logger.warn("Discrepancia de clientId detectada", "REVIEW_SERVICE", {
        bookingClientId: booking.clientId,
        requestClientId: data.clientId,
      });
      throw new AppError(403, "No tienes permiso para reseñar este booking");
    }

    // Verificar que no exista ya una reseña para este booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingReview) {
      throw new AppError(409, "Ya existe una reseña para este booking");
    }

    // Crear la reseña
    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        clientId: data.clientId,
        artistId: booking.artistId,
        serviceId: booking.serviceId,
        rating: data.rating,
        comment: data.comment,
        status: "APPROVED", // Auto-aprobado por defecto
        isVerified: true,
        photos: data.photos
          ? {
              create: data.photos.map((photo, index) => ({
                url: photo.url,
                caption: photo.caption,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        photos: true,
      },
    });

    // Actualizar estadísticas del artista
    await this.updateArtistRating(booking.artistId);

    // Actualizar booking con reviewId
    await bookingClient.updateBookingWithReview(data.bookingId, review.id, data.clientId);

    // Enviar notificación al artista
    await notificationsClient.sendNotification({
      userId: booking.artistId,
      type: 'REVIEW_RECEIVED',
      channel: 'IN_APP',
      title: 'Nueva Reseña Recibida',
      message: `Has recibido una nueva reseña de ${data.rating} estrellas${data.comment ? ' con comentario' : ''}`,
      data: {
        reviewId: review.id,
        rating: review.rating,
        bookingId: data.bookingId,
      },
      priority: 'high',
    }).catch(err => logger.error('Error enviando notificación', 'REVIEW_SERVICE', { error: err.message }));

    logger.info("Reseña creada", "REVIEW_SERVICE", {
      reviewId: review.id,
      bookingId: data.bookingId,
      artistId: booking.artistId,
      rating: data.rating,
    });

    return review;
  }

  /**
   * Obtener reseña por ID
   */
  async getReviewById(id: string, includeRelations = true) {
    const review = await prisma.review.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
      include: includeRelations ? {
        photos: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
        response: {
          where: { deletedAt: null },
        },
      } : undefined,
    });

    if (!review) {
      throw new AppError(404, "Reseña no encontrada");
    }

    return review;
  }

  /**
   * Obtener reseñas con filtros
   */
  async getReviews(filters: {
    artistId?: string;
    clientId?: string;
    serviceId?: string;
    rating?: number;
    status?: ReviewStatus;
    hasComment?: boolean;
    hasPhotos?: boolean;
    sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'helpful';
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {
      deletedAt: null,
      status: filters.status || "APPROVED",
    };

    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.rating) where.rating = filters.rating;
    if (filters.hasComment !== undefined) {
      where.comment = filters.hasComment ? { not: null } : null;
    }
    if (filters.hasPhotos) {
      where.photos = { some: { deletedAt: null } };
    }

    // Determinar orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy === 'rating_high') {
      orderBy = { rating: 'desc' };
    } else if (filters.sortBy === 'rating_low') {
      orderBy = { rating: 'asc' };
    } else if (filters.sortBy === 'helpful') {
      orderBy = { helpfulCount: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          photos: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
          },
          response: {
            where: { deletedAt: null },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualizar una reseña (solo el cliente puede hacerlo dentro de cierto tiempo)
   */
  async updateReview(
    id: string,
    clientId: string,
    data: {
      rating?: number;
      comment?: string;
    }
  ) {
    const review = await this.getReviewById(id, false);

    // Verificar que el cliente es el dueño de la reseña
    if (review.clientId !== clientId) {
      throw new AppError(403, "No tienes permiso para editar esta reseña");
    }

    // Verificar que la reseña tenga menos de 7 días
    const daysSinceCreated = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated > 7) {
      throw new AppError(400, "Solo puedes editar reseñas dentro de los primeros 7 días");
    }

    const updated = await prisma.review.update({
      where: { id },
      data,
      include: {
        photos: {
          where: { deletedAt: null },
        },
        response: {
          where: { deletedAt: null },
        },
      },
    });

    // Si cambió el rating, actualizar estadísticas del artista
    if (data.rating && data.rating !== review.rating) {
      await this.updateArtistRating(review.artistId);
    }

    logger.info("Reseña actualizada", "REVIEW_SERVICE", {
      reviewId: id,
      changes: data,
    });

    return updated;
  }

  /**
   * Eliminar una reseña (soft delete)
   */
  async deleteReview(id: string, userId: string) {
    const review = await this.getReviewById(id, false);

    // Solo el cliente puede eliminar su propia reseña
    if (review.clientId !== userId) {
      throw new AppError(403, "No tienes permiso para eliminar esta reseña");
    }

    const deleted = await prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Actualizar estadísticas del artista
    await this.updateArtistRating(review.artistId);

    logger.info("Reseña eliminada", "REVIEW_SERVICE", {
      reviewId: id,
      artistId: review.artistId,
    });

    return deleted;
  }

  // ==================== RESPONSES ====================

  /**
   * Responder a una reseña (solo artistas)
   */
  async respondToReview(reviewId: string, artistId: string, message: string) {
    const review = await this.getReviewById(reviewId, true);

    // Verificar que el artista es el dueño de la reseña
    if (review.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para responder esta reseña");
    }

    // Verificar que no exista ya una respuesta
    if ((review as any).response) {
      throw new AppError(409, "Ya has respondido a esta reseña");
    }

    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        artistId,
        message,
      },
    });

    // Actualizar tasa de respuesta del artista
    await this.updateArtistRating(artistId);

    // Enviar notificación al cliente
    await notificationsClient.sendNotification({
      userId: review.clientId,
      type: 'REVIEW_RESPONSE',
      channel: 'IN_APP',
      title: 'El artista respondió a tu reseña',
      message: `El artista ha respondido a tu reseña de ${review.rating} estrellas`,
      data: {
        reviewId: review.id,
        responseId: response.id,
      },
      priority: 'normal',
    }).catch(err => logger.error('Error enviando notificación', 'REVIEW_SERVICE', { error: err.message }));

    logger.info("Respuesta a reseña creada", "REVIEW_SERVICE", {
      reviewId,
      artistId,
    });

    return response;
  }

  /**
   * Actualizar respuesta a reseña
   */
  async updateResponse(responseId: string, artistId: string, message: string) {
    const response = await prisma.reviewResponse.findUnique({
      where: { id: responseId, deletedAt: null },
    });

    if (!response) {
      throw new AppError(404, "Respuesta no encontrada");
    }

    if (response.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para editar esta respuesta");
    }

    const updated = await prisma.reviewResponse.update({
      where: { id: responseId },
      data: { message },
    });

    logger.info("Respuesta actualizada", "REVIEW_SERVICE", {
      responseId,
      artistId,
    });

    return updated;
  }

  /**
   * Eliminar respuesta (soft delete)
   */
  async deleteResponse(responseId: string, artistId: string) {
    const response = await prisma.reviewResponse.findUnique({
      where: { id: responseId, deletedAt: null },
    });

    if (!response) {
      throw new AppError(404, "Respuesta no encontrada");
    }

    if (response.artistId !== artistId) {
      throw new AppError(403, "No tienes permiso para eliminar esta respuesta");
    }

    const deleted = await prisma.reviewResponse.update({
      where: { id: responseId },
      data: { deletedAt: new Date() },
    });

    // Actualizar tasa de respuesta del artista
    await this.updateArtistRating(artistId);

    logger.info("Respuesta eliminada", "REVIEW_SERVICE", {
      responseId,
      artistId,
    });

    return deleted;
  }

  // ==================== HELPFUL VOTES ====================

  /**
   * Marcar reseña como útil o no útil
   */
  async markHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    await this.getReviewById(reviewId, false);

    // TODO: Implementar sistema para evitar votos duplicados (requiere tabla adicional)
    // Por ahora, incrementamos directamente

    const field = isHelpful ? "helpfulCount" : "notHelpfulCount";

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        [field]: { increment: 1 },
      },
    });

    logger.info("Voto registrado en reseña", "REVIEW_SERVICE", {
      reviewId,
      userId,
      isHelpful,
    });

    return updated;
  }

  // ==================== REPORTS ====================

  /**
   * Reportar una reseña
   */
  async reportReview(
    reviewId: string,
    reportedBy: string,
    reason: ReportReason,
    description?: string
  ) {
    await this.getReviewById(reviewId, false);

    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reportedBy,
        reason,
        description,
        status: "PENDING",
      },
    });

    logger.info("Reseña reportada", "REVIEW_SERVICE", {
      reviewId,
      reportedBy,
      reason,
    });

    return report;
  }

  /**
   * Obtener reportes pendientes (admin)
   */
  async getPendingReports(page = 1, limit = 20, estado?: string) {
    const skip = (page - 1) * limit;

    // Map frontend estado to DB status; default to PENDING
    const statusMap: Record<string, string> = {
      pending: 'PENDING',
      resolved: 'RESOLVED',
      dismissed: 'DISMISSED',
    };
    const statusFilter = estado ? (statusMap[estado.toLowerCase()] ?? 'PENDING') : 'PENDING';
    const whereClause: any = { deletedAt: null };
    if (estado !== '') whereClause.status = statusFilter;
    // Empty string means "all"
    if (estado === '') delete whereClause.status;

    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where: whereClause,
        include: {
          review: {
            include: {
              photos: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reviewReport.count({
        where: whereClause,
      }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Resolver un reporte (admin)
   */
  async resolveReport(
    id: string,
    resolvedBy: string,
    data: {
      status: "RESOLVED" | "DISMISSED";
      resolution?: string;
    }
  ) {
    const report = await prisma.reviewReport.findUnique({
      where: { id, deletedAt: null },
    });

    if (!report) {
      throw new AppError(404, "Reporte no encontrado");
    }

    const updated = await prisma.reviewReport.update({
      where: { id },
      data: {
        status: data.status,
        resolution: data.resolution,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    logger.info("Reporte resuelto", "REVIEW_SERVICE", {
      reportId: id,
      resolvedBy,
      status: data.status,
    });

    return updated;
  }

  /**
   * Obtener mensajes de un reporte
   */
  async getReportMessages(reportId: string) {
    const report = await prisma.reviewReport.findUnique({
      where: { id: reportId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!report) throw new AppError(404, "Reporte no encontrado");
    return report.messages;
  }

  /**
   * Agregar un mensaje a un reporte (staff → cliente/artista)
   */
  async addReportMessage(
    reportId: string,
    senderId: string,
    senderType: "staff" | "client" | "artist",
    message: string
  ) {
    const report = await prisma.reviewReport.findUnique({
      where: { id: reportId, deletedAt: null },
    });
    if (!report) throw new AppError(404, "Reporte no encontrado");

    const msg = await (prisma as any).reportMessage.create({
      data: { reportId, senderId, senderType, message },
    });

    logger.info("Mensaje agregado a reporte", "REVIEW_SERVICE", { reportId, senderType });
    return msg;
  }

  /**
   * Obtener estadísticas de reportes para el admin
   */
  async getAdminStats() {
    const pendingCount = await prisma.reviewReport.count({
      where: {
        status: "PENDING",
        deletedAt: null,
      },
    });

    return {
      pendingCount,
    };
  }

  /**
   * Obtener estadísticas de reseñas de un usuario específico
   */
  async getUserStats(userId: string) {
    const [totalReviews, totalReports] = await Promise.all([
      prisma.review.count({ where: { clientId: userId, deletedAt: null } }),
      prisma.reviewReport.count({ where: { reportedBy: userId, deletedAt: null } })
    ]);
    return { totalReviews, totalReports };
  }

  async getBatchRatings(artistIds: string[]) {
    const ratings = await prisma.review.groupBy({
      by: ['artistId'],
      where: { artistId: { in: artistIds }, deletedAt: null },
      _avg: { rating: true }
    });
    
    return ratings.reduce((acc: any, r: any) => {
      acc[r.artistId] = { rating: r._avg.rating };
      return acc;
    }, {});
  }

  // ==================== ARTIST RATINGS ====================

  /**
   * Actualizar estadísticas de rating de un artista
   */
  async updateArtistRating(artistId: string) {
    // Obtener todas las reseñas aprobadas del artista
    const reviews = await prisma.review.findMany({
      where: {
        artistId,
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        photos: true,
        response: true,
      },
    });

    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      // Si no hay reseñas, actualizar o crear con valores en 0
      await prisma.artistRating.upsert({
        where: { artistId },
        create: {
          artistId,
          averageRating: 0,
          totalReviews: 0,
          totalWithComment: 0,
          totalWithPhotos: 0,
          responseRate: 0,
          lastCalculatedAt: new Date(),
        },
        update: {
          averageRating: 0,
          totalReviews: 0,
          totalWithComment: 0,
          totalWithPhotos: 0,
          responseRate: 0,
          lastCalculatedAt: new Date(),
        },
      });
      return;
    }

    // Calcular estadísticas
    const rating1Count = reviews.filter(r => r.rating === 1).length;
    const rating2Count = reviews.filter(r => r.rating === 2).length;
    const rating3Count = reviews.filter(r => r.rating === 3).length;
    const rating4Count = reviews.filter(r => r.rating === 4).length;
    const rating5Count = reviews.filter(r => r.rating === 5).length;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReviews;

    const totalWithComment = reviews.filter(r => r.comment).length;
    const totalWithPhotos = reviews.filter(r => r.photos && r.photos.length > 0).length;

    const totalWithResponse = reviews.filter(r => r.response).length;
    const responseRate = (totalWithResponse / totalReviews) * 100;

    // Actualizar o crear registro
    await prisma.artistRating.upsert({
      where: { artistId },
      create: {
        artistId,
        averageRating,
        rating1Count,
        rating2Count,
        rating3Count,
        rating4Count,
        rating5Count,
        totalReviews,
        totalWithComment,
        totalWithPhotos,
        responseRate,
        lastCalculatedAt: new Date(),
      },
      update: {
        averageRating,
        rating1Count,
        rating2Count,
        rating3Count,
        rating4Count,
        rating5Count,
        totalReviews,
        totalWithComment,
        totalWithPhotos,
        responseRate,
        lastCalculatedAt: new Date(),
      },
    });

    logger.info("Estadísticas de artista actualizadas", "REVIEW_SERVICE", {
      artistId,
      totalReviews,
      averageRating,
      responseRate,
    });

    // Sync rating and reviewCount to artists-service
    try {
      const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';
      await fetch(`${artistsUrl}/artists/internal/${artistId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        body: JSON.stringify({ rating: averageRating, reviewCount: totalReviews }),
      });
    } catch (syncErr) {
      logger.warn('Failed to sync rating to artists-service', 'REVIEW_SERVICE', { artistId, syncErr });
    }
  }

  /**
   * Obtener estadísticas de un artista
   */
  async getArtistRating(artistId: string) {
    let rating = await prisma.artistRating.findUnique({
      where: { artistId },
    });

    if (!rating) {
      // Si no existe, calcular ahora
      await this.updateArtistRating(artistId);
      rating = await prisma.artistRating.findUnique({
        where: { artistId },
      });
    }

    return rating;
  }
}

export const reviewService = new ReviewService();
