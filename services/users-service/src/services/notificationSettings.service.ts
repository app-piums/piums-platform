import { PrismaClient } from '@prisma/client';

import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface NotificationPreferences {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}

export class NotificationSettingsService {
  /**
   * Obtener configuración de notificaciones del usuario
   */
  async getSettings(authId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { authId },
        select: {
          id: true,
          notificationsEnabled: true,
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      logger.info('Notification settings retrieved', 'NOTIFICATION_SETTINGS_SERVICE', {
        userId: user.id,
      });

      return {
        notificationsEnabled: user.notificationsEnabled,
        email: user.emailNotifications,
        sms: user.smsNotifications,
        push: user.pushNotifications,
      };
    } catch (error: any) {
      logger.error('Error getting notification settings', 'NOTIFICATION_SETTINGS_SERVICE', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración de notificaciones
   */
  async updateSettings(
    authId: string,
    preferences: NotificationPreferences
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { authId },
      });

      if (!user || user.deletedAt) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      const updatedUser = await prisma.user.update({
        where: { authId },
        data: {
          emailNotifications: preferences.emailNotifications ?? user.emailNotifications,
          smsNotifications: preferences.smsNotifications ?? user.smsNotifications,
          pushNotifications: preferences.pushNotifications ?? user.pushNotifications,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          notificationsEnabled: true,
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        },
      });

      logger.info('Notification settings updated', 'NOTIFICATION_SETTINGS_SERVICE', {
        userId: updatedUser.id,
        preferences,
      });

      return {
        notificationsEnabled: updatedUser.notificationsEnabled,
        email: updatedUser.emailNotifications,
        sms: updatedUser.smsNotifications,
        push: updatedUser.pushNotifications,
      };
    } catch (error: any) {
      logger.error('Error updating notification settings', 'NOTIFICATION_SETTINGS_SERVICE', error);
      throw error;
    }
  }

  /**
   * Configuración por defecto al crear usuario (llamado desde createUser)
   */
  static getDefaultSettings() {
    return {
      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    };
  }
}
