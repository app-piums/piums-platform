import { PrismaClient, MediaType, MediaEntityType, MediaStatus } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class MediaService {
  // ==================== CREATE MEDIA ====================

  /**
   * Crear un nuevo media asset
   */
  async createMedia(data: {
    mediaType: MediaType;
    entityType: MediaEntityType;
    entityId: string;
    originalUrl: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
    title?: string;
    description?: string;
    altText?: string;
    uploadedBy: string;
    order?: number;
    isFeatured?: boolean;
    isPublic?: boolean;
    storageProvider?: string;
    storageKey?: string;
    storageBucket?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }) {
    const media = await prisma.mediaAsset.create({
      data: {
        ...data,
        status: "READY",
      },
    });

    logger.info("Media asset creado", "MEDIA_SERVICE", {
      mediaId: media.id,
      mediaType: data.mediaType,
      entityType: data.entityType,
      entityId: data.entityId,
    });

    return media;
  }

  // ==================== GET MEDIA ====================

  /**
   * Obtener media por ID
   */
  async getMediaById(id: string) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media || media.deletedAt) {
      throw new AppError(404, "Media no encontrado");
    }

    return media;
  }

  // ==================== LIST MEDIA ====================

  /**
   * Listar media por entidad
   */
  async listMediaByEntity(
    entityType: MediaEntityType,
    entityId: string,
    filters?: {
      mediaType?: MediaType;
      isPublic?: boolean;
      isFeatured?: boolean;
    }
  ) {
    const where: any = {
      entityType,
      entityId,
      deletedAt: null,
      status: "READY",
    };

    if (filters?.mediaType) where.mediaType = filters.mediaType;
    if (filters?.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    const media = await prisma.mediaAsset.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return media;
  }

  // ==================== UPDATE MEDIA ====================

  /**
   * Actualizar media asset
   */
  async updateMedia(
    id: string,
    data: {
      title?: string;
      description?: string;
      altText?: string;
      order?: number;
      isFeatured?: boolean;
      isPublic?: boolean;
      tags?: string[];
    }
  ) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media || media.deletedAt) {
      throw new AppError(404, "Media no encontrado");
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data,
    });

    logger.info("Media actualizado", "MEDIA_SERVICE", {
      mediaId: id,
    });

    return updated;
  }

  // ==================== DELETE MEDIA ====================

  /**
   * Eliminar media (soft delete)
   */
  async deleteMedia(id: string, userId: string) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media || media.deletedAt) {
      throw new AppError(404, "Media no encontrado");
    }

    // Verificar permisos - solo el que subió puede eliminar
    if (media.uploadedBy !== userId) {
      throw new AppError(403, "No tienes permiso para eliminar este media");
    }

    const deleted = await prisma.mediaAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    logger.info("Media eliminado", "MEDIA_SERVICE", {
      mediaId: id,
      userId,
    });

    return deleted;
  }

  // ==================== REORDER MEDIA ====================

  /**
   * Reordenar media assets de una entidad
   */
  async reorderMedia(entityType: MediaEntityType, entityId: string, mediaOrders: { id: string; order: number }[]) {
    // Actualizar todos los orders en una transacción
    await prisma.$transaction(
      mediaOrders.map(({ id, order }) =>
        prisma.mediaAsset.update({
          where: { id },
          data: { order },
        })
      )
    );

    logger.info("Media reordenado", "MEDIA_SERVICE", {
      entityType,
      entityId,
      count: mediaOrders.length,
    });

    return { success: true, count: mediaOrders.length };
  }

  // ==================== SET FEATURED ====================

  /**
   * Marcar/desmarcar como destacado
   */
  async setFeatured(id: string, isFeatured: boolean) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media || media.deletedAt) {
      throw new AppError(404, "Media no encontrado");
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { isFeatured },
    });

    logger.info("Media featured actualizado", "MEDIA_SERVICE", {
      mediaId: id,
      isFeatured,
    });

    return updated;
  }

  // ==================== STATS ====================

  /**
   * Obtener estadísticas de media por entidad
   */
  async getMediaStats(entityType: MediaEntityType, entityId: string) {
    const where = {
      entityType,
      entityId,
      deletedAt: null as null,
      status: "READY" as const,
    };

    const [total, byType, totalSize] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.groupBy({
        by: ["mediaType"],
        where,
        _count: true,
      }),
      prisma.mediaAsset.aggregate({
        where,
        _sum: { fileSize: true },
      }),
    ]);

    return {
      total,
      byType: byType.map((t: any) => ({
        type: t.mediaType,
        count: t._count,
      })),
      totalSizeBytes: totalSize._sum?.fileSize || 0,
      totalSizeMB: ((totalSize._sum?.fileSize || 0) / 1024 / 1024).toFixed(2),
    };
  }

  // ==================== BULK DELETE ====================

  /**
   * Eliminar múltiples media assets (solo si el usuario los subió)
   */
  async bulkDeleteMedia(mediaIds: string[], userId: string) {
    // Verificar que todos pertenezcan al usuario
    const media = await prisma.mediaAsset.findMany({
      where: {
        id: { in: mediaIds },
        uploadedBy: userId,
        deletedAt: null,
      },
    });

    if (media.length !== mediaIds.length) {
      throw new AppError(403, "No tienes permiso para eliminar algunos medios");
    }

    // Soft delete en batch
    const result = await prisma.mediaAsset.updateMany({
      where: {
        id: { in: mediaIds },
      },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    logger.info("Media eliminado en bulk", "MEDIA_SERVICE", {
      count: result.count,
      userId,
    });

    return { deleted: result.count };
  }
}

export const mediaService = new MediaService();
