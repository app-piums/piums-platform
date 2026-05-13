import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

interface PushOptions {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class PushProvider {
  private enabled: boolean = false;

  constructor() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set, push notifications disabled', 'PUSH_PROVIDER');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      }
      this.enabled = true;
      logger.info('Push notifications provider initialized (FCM)', 'PUSH_PROVIDER');
    } catch (e: any) {
      logger.error('Failed to initialize Firebase Admin SDK', 'PUSH_PROVIDER', e);
    }
  }

  async sendPush(options: PushOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      const messageId = await admin.messaging().send({
        token: options.fcmToken,
        notification: { title: options.title, body: options.body },
        data: options.data ?? {},
        apns: {
          payload: { aps: { sound: 'default', badge: 1, contentAvailable: 1 } },
        },
      });

      logger.info('Push notification sent', 'PUSH_PROVIDER', { messageId });
      return { success: true, messageId };
    } catch (error: any) {
      logger.error('Failed to send push notification', 'PUSH_PROVIDER', error);
      return { success: false, error: error.message };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const pushProvider = new PushProvider();
