import { PrismaClient, NotificationChannel, NotificationStatus } from '@prisma/client';
import { emailProvider } from '../providers/email.provider';
import { smsProvider } from '../providers/sms.provider';
import { pushProvider } from '../providers/push.provider';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import {
  SendNotificationInput,
  BatchSendInput,
  SendFromTemplateInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpdatePreferencesInput,
  SearchNotificationsInput,
} from '../schemas/notification.schema';

const prisma = new PrismaClient();

export class NotificationService {
  // ============================================================================
  // Send Notifications
  // ============================================================================

  async sendNotification(data: SendNotificationInput) {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(data.userId);

      // Check if user has this channel enabled
      if (!this.isChannelEnabled(data.channel, preferences)) {
        logger.warn('Channel disabled for user', 'NOTIFICATION_SERVICE', {
          userId: data.userId,
          channel: data.channel,
        });
        
        throw new AppError(`${data.channel} notifications disabled for this user`, 400);
      }

      // Check Do Not Disturb
      if (this.isInDNDPeriod(preferences)) {
        logger.info('User in DND period, scheduling for later', 'NOTIFICATION_SERVICE', {
          userId: data.userId,
        });
        
        // Schedule for after DND period
        data.scheduledFor = this.getNextAvailableTime(preferences).toISOString();
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          channel: data.channel,
          title: data.title,
          message: data.message,
          data: data.data || {},
          emailTo: data.emailTo,
          emailSubject: data.emailSubject,
          emailHtml: data.emailHtml,
          phoneNumber: data.phoneNumber,
          fcmToken: data.fcmToken,
          status: data.scheduledFor ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          priority: data.priority,
          category: data.category,
          templateId: data.templateId,
        },
      });

      // If not scheduled, send immediately
      if (!data.scheduledFor) {
        await this.processNotification(notification.id);
      }

      logger.info('Notification created', 'NOTIFICATION_SERVICE', {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        channel: data.channel,
      });

      return notification;
    } catch (error: any) {
      logger.error('Failed to send notification', 'NOTIFICATION_SERVICE', error);
      throw error;
    }
  }

  async batchSend(data: BatchSendInput) {
    try {
      const notifications = await Promise.all(
        data.userIds.map((userId) =>
          this.sendNotification({
            userId,
            type: data.type,
            channel: data.channel,
            title: data.title,
            message: data.message,
            data: data.data,
            priority: data.priority,
            category: data.category,
            templateId: data.templateId,
          }).catch((error) => {
            logger.error('Failed to send notification in batch', 'NOTIFICATION_SERVICE', {
              userId,
              error: error.message,
            });
            return null;
          })
        )
      );

      const successful = notifications.filter((n) => n !== null);

      logger.info('Batch send completed', 'NOTIFICATION_SERVICE', {
        total: data.userIds.length,
        successful: successful.length,
        failed: data.userIds.length - successful.length,
      });

      return {
        total: data.userIds.length,
        successful: successful.length,
        failed: data.userIds.length - successful.length,
        notifications: successful,
      };
    } catch (error: any) {
      logger.error('Batch send failed', 'NOTIFICATION_SERVICE', error);
      throw error;
    }
  }

  async sendFromTemplate(data: SendFromTemplateInput) {
    try {
      // Get template
      const template = await prisma.notificationTemplate.findUnique({
        where: { key: data.templateKey },
      });

      if (!template) {
        throw new AppError(`Template '${data.templateKey}' not found`, 404);
      }

      if (!template.isActive) {
        throw new AppError(`Template '${data.templateKey}' is inactive`, 400);
      }

      // Replace variables in title and message
      const title = this.replaceVariables(template.title, data.variables || {});
      const message = this.replaceVariables(template.message, data.variables || {});
      const emailSubject = template.emailSubject
        ? this.replaceVariables(template.emailSubject, data.variables || {})
        : undefined;
      const emailHtml = template.emailHtml
        ? this.replaceVariables(template.emailHtml, data.variables || {})
        : undefined;

      // Send notification
      return await this.sendNotification({
        userId: data.userId,
        type: template.type as any,
        channel: data.channel,
        title,
        message,
        emailSubject,
        emailHtml,
        scheduledFor: data.scheduledFor,
        priority: template.priority as any,
        category: template.category || undefined,
        templateId: template.id,
      });
    } catch (error: any) {
      logger.error('Failed to send from template', 'NOTIFICATION_SERVICE', error);
      throw error;
    }
  }

  /**
   * Método simple para enviar emails con templates HTML desde filesystem
   * Uso interno para comunicación entre servicios
   */
  async sendTemplateEmail(to: string, template: string, variables: Record<string, any>) {
    try {
      const fs = require('fs');
      const path = require('path');

      // Mapeo de templates a archivos HTML
      const templateFiles: Record<string, string> = {
        'password-reset': 'password-reset.html',
        'email-verification': 'email-verification.html',
        'payment-confirmation': 'payment-confirmation.html',
        'review-request': 'review-request.html',
      };

      const templateFile = templateFiles[template];
      if (!templateFile) {
        throw new AppError(`Template '${template}' no encontrado`, 404);
      }

      // Leer archivo de template
      const templatePath = path.join(__dirname, '../templates', templateFile);
      if (!fs.existsSync(templatePath)) {
        throw new AppError(`Archivo de template '${templateFile}' no encontrado`, 404);
      }

      let htmlContent = fs.readFileSync(templatePath, 'utf-8');

      // Reemplazar variables
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, variables[key] || '');
      });

      // Determinar subject según template
      const subjects: Record<string, string> = {
        'password-reset': 'Recupera tu contraseña - Piums',
        'email-verification': '¡Bienvenido a Piums! Verifica tu email',
        'payment-confirmation': 'Confirmación de pago - Piums',
        'review-request': '¿Cómo fue tu experiencia? Comparte tu opinión',
      };

      const subject = subjects[template] || 'Notificación - Piums';

      // Enviar email
      const result = await emailProvider.sendEmail({
        to,
        subject,
        html: htmlContent,
      });

      logger.info('Template email sent', 'NOTIFICATION_SERVICE', {
        to,
        template,
        success: result.success,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to send template email', 'NOTIFICATION_SERVICE', error);
      throw error;
    }
  }

  // ============================================================================
  // Process Notification (actually send via provider)
  // ============================================================================

  async processNotification(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      // Update status to SENDING
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENDING },
      });

      let result: { success: boolean; messageId?: string; error?: string } = {
        success: false,
      };

      // Send via appropriate provider
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          result = await this.sendViaEmail(notification);
          break;

        case NotificationChannel.SMS:
          result = await this.sendViaSMS(notification);
          break;

        case NotificationChannel.PUSH:
          result = await this.sendViaPush(notification);
          break;

        case NotificationChannel.IN_APP:
          // In-app notifications are just stored, no external sending
          result = { success: true };
          break;

        default:
          throw new AppError(`Unsupported channel: ${notification.channel}`, 400);
      }

      // Update notification status
      if (result.success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        // Log success
        await this.logNotificationEvent(notificationId, 'sent', result.messageId);

        logger.info('Notification sent successfully', 'NOTIFICATION_SERVICE', {
          notificationId,
          channel: notification.channel,
        });
      } else {
        // Handle failure
        const newRetries = notification.retries + 1;
        const newStatus =
          newRetries >= notification.maxRetries
            ? NotificationStatus.FAILED
            : NotificationStatus.PENDING;

        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: newStatus,
            retries: newRetries,
            lastError: result.error,
          },
        });

        // Log failure
        await this.logNotificationEvent(notificationId, 'failed', undefined, result.error);

        logger.error('Notification failed', 'NOTIFICATION_SERVICE', {
          notificationId,
          channel: notification.channel,
          error: result.error,
          retries: newRetries,
        });
      }

      return result;
    } catch (error: any) {
      logger.error('Failed to process notification', 'NOTIFICATION_SERVICE', error);
      throw error;
    }
  }

  private async sendViaEmail(notification: any) {
    if (!notification.emailTo) {
      return { success: false, error: 'Email address not provided' };
    }

    return await emailProvider.sendEmail({
      to: notification.emailTo,
      subject: notification.emailSubject || notification.title,
      text: notification.message,
      html: notification.emailHtml || notification.message,
    });
  }

  private async sendViaSMS(notification: any) {
    if (!notification.phoneNumber) {
      return { success: false, error: 'Phone number not provided' };
    }

    return await smsProvider.sendSMS({
      to: notification.phoneNumber,
      message: `${notification.title}\n\n${notification.message}`,
    });
  }

  private async sendViaPush(notification: any) {
    if (!notification.fcmToken) {
      return { success: false, error: 'FCM token not provided' };
    }

    return await pushProvider.sendPush({
      fcmToken: notification.fcmToken,
      title: notification.title,
      body: notification.message,
      data: notification.data as Record<string, any>,
    });
  }

  // ============================================================================
  // Notification Queries
  // ============================================================================

  async getNotificationById(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  async searchNotifications(params: SearchNotificationsInput) {
    const where: any = {};

    if (params.userId) where.userId = params.userId;
    if (params.type) where.type = params.type;
    if (params.channel) where.channel = params.channel;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const skip = (params.page - 1) * params.limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    };
  }

  async markAsRead(notificationIds: string[], userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Security: only mark user's own notifications
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    logger.info('Notifications marked as read', 'NOTIFICATION_SERVICE', {
      userId,
      count: result.count,
    });

    return { updated: result.count };
  }

  async deleteNotification(id: string, userId: string) {
    // Verify ownership
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found or unauthorized', 404);
    }

    await prisma.notification.delete({
      where: { id },
    });

    logger.info('Notification deleted', 'NOTIFICATION_SERVICE', { id, userId });

    return { deleted: true };
  }

  // ============================================================================
  // Templates
  // ============================================================================

  async createTemplate(data: CreateTemplateInput) {
    try {
      const template = await prisma.notificationTemplate.create({
        data: {
          key: data.key,
          name: data.name,
          description: data.description,
          type: data.type,
          title: data.title,
          message: data.message,
          emailSubject: data.emailSubject,
          emailHtml: data.emailHtml,
          variables: data.variables || [],
          priority: data.priority,
          category: data.category,
        },
      });

      logger.info('Template created', 'NOTIFICATION_SERVICE', {
        templateId: template.id,
        key: template.key,
      });

      return template;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError('Template with this key already exists', 400);
      }
      throw error;
    }
  }

  async getTemplateByKey(key: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { key },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return template;
  }

  async listTemplates(type?: string, isActive?: boolean) {
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async updateTemplate(key: string, data: UpdateTemplateInput) {
    const template = await prisma.notificationTemplate.update({
      where: { key },
      data,
    });

    logger.info('Template updated', 'NOTIFICATION_SERVICE', {
      templateId: template.id,
      key: template.key,
    });

    return template;
  }

  async deleteTemplate(key: string) {
    await prisma.notificationTemplate.delete({
      where: { key },
    });

    logger.info('Template deleted', 'NOTIFICATION_SERVICE', { key });

    return { deleted: true };
  }

  // ============================================================================
  // User Preferences
  // ============================================================================

  async getUserPreferences(userId: string) {
    let preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exist
    if (!preferences) {
      preferences = await prisma.userNotificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updateUserPreferences(userId: string, data: UpdatePreferencesInput) {
    const preferences = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    logger.info('User preferences updated', 'NOTIFICATION_SERVICE', { userId });

    return preferences;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private isChannelEnabled(channel: NotificationChannel, preferences: any): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.emailEnabled;
      case NotificationChannel.SMS:
        return preferences.smsEnabled;
      case NotificationChannel.PUSH:
        return preferences.pushEnabled;
      case NotificationChannel.IN_APP:
        return true; // Always enabled
      default:
        return false;
    }
  }

  private isInDNDPeriod(preferences: any): boolean {
    if (!preferences.dndEnabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const start = preferences.dndStartHour;
    const end = preferences.dndEndHour;

    if (start === null || end === null) return false;

    // Handle overnight DND periods
    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      return currentHour >= start || currentHour < end;
    }
  }

  private getNextAvailableTime(preferences: any): Date {
    const now = new Date();
    const nextAvailable = new Date(now);

    if (preferences.dndEnabled && preferences.dndEndHour !== null) {
      nextAvailable.setHours(preferences.dndEndHour, 0, 0, 0);

      // If end hour is before current hour, schedule for next day
      if (preferences.dndEndHour <= now.getHours()) {
        nextAvailable.setDate(nextAvailable.getDate() + 1);
      }
    }

    return nextAvailable;
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private async logNotificationEvent(
    notificationId: string,
    event: string,
    providerId?: string,
    errorMessage?: string
  ) {
    try {
      await prisma.notificationLog.create({
        data: {
          notificationId,
          event,
          providerId,
          errorMessage,
        },
      });
    } catch (error) {
      logger.error('Failed to log notification event', 'NOTIFICATION_SERVICE', error);
    }
  }

  // ============================================================================
  // Stats
  // ============================================================================

  async getStats(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;

    const [total, pending, sent, failed, read] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, status: NotificationStatus.PENDING } }),
      prisma.notification.count({ where: { ...where, status: NotificationStatus.SENT } }),
      prisma.notification.count({ where: { ...where, status: NotificationStatus.FAILED } }),
      prisma.notification.count({ where: { ...where, status: NotificationStatus.READ } }),
    ]);

    return {
      total,
      pending,
      sent,
      failed,
      read,
    };
  }
}

export const notificationService = new NotificationService();
