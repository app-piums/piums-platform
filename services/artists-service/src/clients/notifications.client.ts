import { logger } from '../utils/logger';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4006';
const SERVICE_TOKEN = process.env.JWT_SECRET || '';

class NotificationsClient {
  async send(payload: {
    userId: string;
    type: string;
    channel: 'IN_APP' | 'EMAIL' | 'PUSH';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const res = await fetch(`${NOTIFICATIONS_SERVICE_URL}/api/notifications/send`, {
        signal: AbortSignal.timeout(8_000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_TOKEN}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) logger.error('Error enviando notificacion de banda', 'NOTIF_CLIENT');
    } catch {
      logger.error('Notificaciones service no disponible', 'NOTIF_CLIENT');
    }
  }
}

export const notificationsClient = new NotificationsClient();
