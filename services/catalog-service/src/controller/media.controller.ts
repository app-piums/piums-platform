import { Request, Response, NextFunction } from "express";
import { mediaService } from "../services/media.service";
import { MediaType, MediaEntityType } from "@prisma/client";

export class MediaController {
  // ==================== CREATE MEDIA ====================

  async createMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const {
        mediaType,
        entityType,
        entityId,
        originalUrl,
        url,
        thumbnailUrl,
        filename,
        mimeType,
        fileSize,
        width,
        height,
        duration,
        title,
        description,
        altText,
        order,
        isFeatured,
        isPublic,
        storageProvider,
        storageKey,
        storageBucket,
        tags,
        metadata,
      } = req.body;

      // Validaciones básicas
      if (!mediaType || !entityType || !entityId || !url || !filename || !mimeType || !fileSize) {
        return res.status(400).json({
          error: "mediaType, entityType, entityId, url, filename, mimeType y fileSize son requeridos",
        });
      }

      const media = await mediaService.createMedia({
        mediaType: mediaType as MediaType,
        entityType: entityType as MediaEntityType,
        entityId,
        originalUrl: originalUrl || url,
        url,
        thumbnailUrl,
        filename,
        mimeType,
        fileSize: parseInt(fileSize),
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        title,
        description,
        altText,
        uploadedBy: userId,
        order: order ? parseInt(order) : undefined,
        isFeatured,
        isPublic,
        storageProvider,
        storageKey,
        storageBucket,
        tags,
        metadata,
      });

      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  }

  // ==================== GET MEDIA ====================

  async getMediaById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const media = await mediaService.getMediaById(id);

      res.json(media);
    } catch (error) {
      next(error);
    }
  }

  // ==================== LIST MEDIA ====================

  async listMediaByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const { mediaType, isPublic, isFeatured } = req.query;

      const media = await mediaService.listMediaByEntity(
        entityType as MediaEntityType,
        entityId,
        {
          mediaType: mediaType as MediaType,
          isPublic: isPublic === "true",
          isFeatured: isFeatured === "true",
        }
      );

      res.json(media);
    } catch (error) {
      next(error);
    }
  }

  // ==================== UPDATE MEDIA ====================

  async updateMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, altText, order, isFeatured, isPublic, tags } = req.body;

      const media = await mediaService.updateMedia(id, {
        title,
        description,
        altText,
        order: order ? parseInt(order) : undefined,
        isFeatured,
        isPublic,
        tags,
      });

      res.json(media);
    } catch (error) {
      next(error);
    }
  }

  // ==================== DELETE MEDIA ====================

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await mediaService.deleteMedia(id, userId);

      res.json({ message: "Media eliminado" });
    } catch (error) {
      next(error);
    }
  }

  // ==================== REORDER MEDIA ====================

  async reorderMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "items es requerido y debe ser un array" });
      }

      const result = await mediaService.reorderMedia(
        entityType as MediaEntityType,
        entityId,
        items
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== SET FEATURED ====================

  async setFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;

      if (isFeatured === undefined) {
        return res.status(400).json({ error: "isFeatured es requerido" });
      }

      const media = await mediaService.setFeatured(id, isFeatured);

      res.json(media);
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATS ====================

  async getMediaStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;

      const stats = await mediaService.getMediaStats(
        entityType as MediaEntityType,
        entityId
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== BULK DELETE ====================

  async bulkDeleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { mediaIds } = req.body;

      if (!mediaIds || !Array.isArray(mediaIds)) {
        return res.status(400).json({ error: "mediaIds es requerido y debe ser un array" });
      }

      const result = await mediaService.bulkDeleteMedia(mediaIds, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
