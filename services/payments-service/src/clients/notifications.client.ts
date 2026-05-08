/**
 * Cliente HTTP para comunicarse con notifications-service
 */
import jwt from 'jsonwebtoken';

const NOTIFICATIONS_SERVICE_URL =
  process.env.NOTIFICATIONS_SERVICE_URL || "http://notifications-service:4007";
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_CHANGE_IN_PRODUCTION';

function getServiceToken(): string {
  return jwt.sign(
    { id: 'payments-service', email: 'payments@internal', role: 'service' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  title: string;
  message: string;
  data?: Record<string, any>;
  emailTo?: string;
  emailSubject?: string;
  emailHtml?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  category?: string;
}

export class NotificationsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
  }

  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getServiceToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        console.error(
          "[NotificationsClient] Error enviando notificación:",
          error
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[NotificationsClient] Error de conexión con notifications-service:",
        error
      );
      return null;
    }
  }
}

export const notificationsClient = new NotificationsClient();
