/**
 * Cliente HTTP para comunicarse con notifications-service
 */

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4006';
const SERVICE_TOKEN = process.env.JWT_SECRET; // Usamos el mismo secret para inter-service communication

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  emailTo?: string;
  emailSubject?: string;
  emailHtml?: string;
  phoneNumber?: string;
}

interface SendFromTemplatePayload {
  userId: string;
  templateKey: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface BatchSendPayload {
  userIds: string[];
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
}

export class NotificationsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || '';
  }

  /**
   * Enviar una notificación directa
   */
  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
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

  /**
   * Enviar notificación desde un template
   */
  async sendFromTemplate(payload: SendFromTemplatePayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error enviando desde template:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
      return null;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async batchSend(payload: BatchSendPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error en batch send:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
      return null;
    }
  }

  /**
   * Verificar si el servicio de notificaciones está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[NotificationsClient] Notifications service no disponible:', error);
      return false;
    }
  }
}

// Instancia singleton
export const notificationsClient = new NotificationsClient();
