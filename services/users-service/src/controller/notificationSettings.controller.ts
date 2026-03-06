import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotificationSettingsService } from '../services/notificationSettings.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { notificationSettingsSchema } from '../schemas/notificationSettings.schema';

const notificationSettingsService = new NotificationSettingsService();

/**
 * GET /api/users/me/notifications-settings - Obtener configuración de notificaciones
 */
export const getNotificationSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, 'No autenticado');
    }

    const settings = await notificationSettingsService.getSettings(authId);

    logger.info('Notification settings retrieved', 'NOTIFICATIONS_CONTROLLER', {
      authId,
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/me/notifications-settings - Actualizar configuración de notificaciones
 */
export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, 'No autenticado');
    }

    const validatedData = notificationSettingsSchema.parse(req.body);

    const settings = await notificationSettingsService.updateSettings(
      authId,
      validatedData
    );

    logger.info('Notification settings updated', 'NOTIFICATIONS_CONTROLLER', {
      authId,
    });

    res.json({
      message: 'Configuración de notificaciones actualizada',
      settings,
    });
  } catch (error) {
    next(error);
  }
};
