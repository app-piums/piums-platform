import twilio from 'twilio';
import { logger } from '../utils/logger';

interface SMSOptions {
  to: string;
  message: string;
}

class SMSProvider {
  private client: any = null;
  private enabled: boolean;
  private phoneNumber: string = '';

  constructor() {
    this.enabled = process.env.ENABLE_SMS === 'true';
    
    if (this.enabled) {
      this.initialize();
    } else {
      logger.info('SMS provider disabled');
    }
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.phoneNumber) {
      logger.warn('Twilio configuration incomplete, SMS provider disabled');
      this.enabled = false;
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);

      logger.info('SMS provider initialized successfully', 'SMS_PROVIDER', {
        phoneNumber: this.phoneNumber,
      });
    } catch (error) {
      logger.error('Failed to initialize SMS provider', 'SMS_PROVIDER', error);
      this.enabled = false;
    }
  }

  async sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled || !this.client) {
      return {
        success: false,
        error: 'SMS provider not enabled or configured',
      };
    }

    try {
      const message = await this.client.messages.create({
        body: options.message,
        from: this.phoneNumber,
        to: options.to,
      });

      logger.info('SMS sent successfully', 'SMS_PROVIDER', {
        to: options.to,
        messageId: message.sid,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error: any) {
      logger.error('Failed to send SMS', 'SMS_PROVIDER', {
        to: options.to,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const smsProvider = new SMSProvider();
