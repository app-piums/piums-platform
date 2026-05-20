const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4006';
const SERVICE_TOKEN = process.env.JWT_SECRET || '';

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
}

export class NotificationsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN;
  }

  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async sendBoth(inApp: SendNotificationPayload, emailPayload?: Omit<SendNotificationPayload, 'channel'> & { emailTo: string }): Promise<void> {
    const tasks: Promise<any>[] = [this.sendNotification(inApp)];
    if (emailPayload) {
      tasks.push(this.sendNotification({ ...emailPayload, channel: 'EMAIL' }));
    }
    await Promise.allSettled(tasks);
  }
}

export const notificationsClient = new NotificationsClient();
