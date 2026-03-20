import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import {
  sendNotificationSchema,
  batchSendSchema,
  sendFromTemplateSchema,
  createTemplateSchema,
  updateTemplateSchema,
  updatePreferencesSchema,
  searchNotificationsSchema,
  markAsReadSchema,
} from '../schemas/notification.schema';

export class NotificationController {
  // ============================================================================
  // Send Notifications
  // ============================================================================

  async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendNotificationSchema.parse(req.body);
      const notification = await notificationService.sendNotification(data);

      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async batchSend(req: Request, res: Response, next: NextFunction) {
    try {
      const data = batchSendSchema.parse(req.body);
      const result = await notificationService.batchSend(data);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendFromTemplateSchema.parse(req.body);
      const notification = await notificationService.sendFromTemplate(data);

      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint simple para enviar emails con templates
   * Uso interno para comunicación entre servicios
   */
  async sendTemplateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { to, template, variables } = req.body;

      if (!to || !template) {
        return res.status(400).json({
          error: 'Los campos "to" y "template" son requeridos'
        });
      }

      const result = await notificationService.sendTemplateEmail(to, template, variables || {});

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // ============================================================================
  // Notification Queries
  // ============================================================================

  async getNotificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const notification = await notificationService.getNotificationById(id);

      res.status(200).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async searchNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const params = searchNotificationsSchema.parse(req.query);
      const result = await notificationService.searchNotifications(params);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = markAsReadSchema.parse(req.body);
      const userId = req.user!.id;
      const result = await notificationService.markAsRead(data.notificationIds, userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const result = await notificationService.deleteNotification(id, userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Templates
  // ============================================================================

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTemplateSchema.parse(req.body);
      const template = await notificationService.createTemplate(data);

      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  async getTemplateByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const template = await notificationService.getTemplateByKey(key);

      res.status(200).json(template);
    } catch (error) {
      next(error);
    }
  }

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, isActive } = req.query;
      const templates = await notificationService.listTemplates(
        type as string,
        isActive ? isActive === 'true' : undefined
      );

      res.status(200).json(templates);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const data = updateTemplateSchema.parse(req.body);
      const template = await notificationService.updateTemplate(key, data);

      res.status(200).json(template);
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const result = await notificationService.deleteTemplate(key);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // User Preferences
  // ============================================================================

  async getUserPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await notificationService.getUserPreferences(userId);

      res.status(200).json(preferences);
    } catch (error) {
      next(error);
    }
  }

  async updateUserPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = updatePreferencesSchema.parse(req.body);
      const preferences = await notificationService.updateUserPreferences(userId, data);

      res.status(200).json(preferences);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // Stats
  // ============================================================================

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.query;
      const stats = await notificationService.getStats(userId as string);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
