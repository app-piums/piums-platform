/**
 * Cliente HTTP para comunicarse con notifications-service
 */

const NOTIFICATIONS_SERVICE_URL =
  process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4006";
const SERVICE_TOKEN = process.env.JWT_SECRET;

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high" | "urgent";
  category?: string;
}

export class NotificationsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || "";
  }

  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.serviceToken}`,
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
