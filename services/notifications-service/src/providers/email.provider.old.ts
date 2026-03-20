import nodemailer, { Transporter } from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

type EmailProviderType = 'sendgrid' | 'nodemailer' | 'disabled';

class EmailProvider {
  private transporter: Transporter | null = null;
  private enabled: boolean;
  private providerType: EmailProviderType;
  private readonly _fromEmail: string;

  constructor() {
    this.enabled = process.env.ENABLE_EMAIL === 'true';
    this.providerType = this.enabled ? (process.env.EMAIL_PROVIDER as EmailProviderType || 'nodemailer') : 'disabled';
    this._fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@piums.com';
    
    if (this.enabled) {
      this.initialize();
    } else {
      logger.info('Email provider disabled');
    }
  }

  private initialize() {
    if (this.providerType === 'sendgrid') {
      this.initializeSendGrid();
    } else if (this.providerType === 'nodemailer') {
      this.initializeNodemailer();
    } else {
      logger.warn('Unknown email provider type, email disabled');
      this.enabled = false;
    }
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      logger.warn('SendGrid API key missing, email provider disabled');
      this.enabled = false;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      logger.info('SendGrid email provider initialized successfully', 'EMAIL_PROVIDER');
    } catch (error) {
      logger.error('Failed to initialize SendGrid', 'EMAIL_PROVIDER', error);
      this.enabled = false;
    }
  }

  private initializeNodemailer() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;

    if (!host || !user || !password) {
      logger.warn('Email configuration incomplete, email provider disabled');
      this.enabled = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
      });

      logger.info('Nodemailer email provider initialized successfully', 'EMAIL_PROVIDER', {
        host,
        port,
        secure,
      });
    } catch (error) {
      logger.error('Failed to initialize nodemailer', 'EMAIL_PROVIDER', error);
      this.enabled = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled || !this.transporter) {
      return {
        success: false,
        error: 'Email provider not enabled or configured',
      };
    }

    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('Email sent successfully', 'EMAIL_PROVIDER', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error('Failed to send email', 'EMAIL_PROVIDER', {
        to: options.to,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email provider connection verified');
      return true;
    } catch (error) {
      logger.error('Email provider connection failed', 'EMAIL_PROVIDER', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const emailProvider = new EmailProvider();
