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
  private fromEmail: string;

  constructor() {
    this.enabled = process.env.ENABLE_EMAIL === 'true';
    this.providerType = this.enabled ? (process.env.EMAIL_PROVIDER as EmailProviderType || 'nodemailer') : 'disabled';
    this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@piums.com';
    
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
    if (!this.enabled) {
      return {
        success: false,
        error: 'Email provider not enabled or configured',
      };
    }

    if (this.providerType === 'sendgrid') {
      return this.sendWithSendGrid(options);
    } else if (this.providerType === 'nodemailer') {
      return this.sendWithNodemailer(options);
    }

    return {
      success: false,
      error: 'No valid email provider configured',
    };
  }

  private async sendWithSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const msg: any = {
        to: options.to,
        from: options.from || this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      if (options.replyTo) {
        msg.replyTo = options.replyTo;
      }

      if (options.attachments) {
        msg.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType,
          disposition: 'attachment',
        }));
      }

      const [response] = await sgMail.send(msg);

      logger.info('Email sent successfully via SendGrid', 'EMAIL_PROVIDER', {
        to: options.to,
        subject: options.subject,
        statusCode: response.statusCode,
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error: any) {
      logger.error('Failed to send email via SendGrid', 'EMAIL_PROVIDER', {
        to: options.to,
        error: error.message,
        response: error.response?.body,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendWithNodemailer(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Nodemailer not initialized',
      };
    }

    try {
      const mailOptions: any = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
      }

      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully via Nodemailer', 'EMAIL_PROVIDER', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error('Failed to send email via Nodemailer', 'EMAIL_PROVIDER', {
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
    if (!this.enabled) {
      return false;
    }

    if (this.providerType === 'sendgrid') {
      // SendGrid no tiene verify, asumimos que está ok si la API key está configurada
      return true;
    } else if (this.providerType === 'nodemailer' && this.transporter) {
      try {
        await this.transporter.verify();
        logger.info('Email provider connection verified');
        return true;
      } catch (error) {
        logger.error('Email provider connection failed', 'EMAIL_PROVIDER', error);
        return false;
      }
    }

    return false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getProviderType(): EmailProviderType {
    return this.providerType;
  }
}

export const emailProvider = new EmailProvider();
