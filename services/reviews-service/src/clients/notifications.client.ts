/**
 * Cliente HTTP para comunicarse con notifications-service
 */

import jwt from "jsonwebtoken";

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4006';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const generateServiceToken = (userId: string): string => {
  return jwt.sign({ userId, email: 'service@internal', isService: true }, JWT_SECRET, { expiresIn: '5m' });
};

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class NotificationsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
  }

  /**
   * Enviar una notificación
   */
  async sendNotification(payload: SendNotificationPayload): Promise<any | null> {
    try {
      const serviceToken = generateServiceToken(payload.userId);
      
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error enviando notificación:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
      return null;
    }
  }
}

export const notificationsClient = new NotificationsClient();
