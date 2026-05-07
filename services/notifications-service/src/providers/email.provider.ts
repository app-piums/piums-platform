import nodemailer, { Transporter } from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
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

type EmailProviderType = 'resend' | 'sendgrid' | 'nodemailer' | 'disabled';

class EmailProvider {
  private transporter: Transporter | null = null;
  private resendClient: Resend | null = null;
  private enabled: boolean;
  private providerType: EmailProviderType;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.enabled = process.env.ENABLE_EMAIL === 'true';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@piums.io';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Piums';

    if (this.enabled) {
      // Auto-detect provider: Resend takes priority if key is present
      if (process.env.RESEND_API_KEY) {
        this.providerType = 'resend';
      } else {
        this.providerType = (process.env.EMAIL_PROVIDER as EmailProviderType) || 'nodemailer';
      }
      this.initialize();
    } else {
      this.providerType = 'disabled';
      logger.info('Email provider disabled (ENABLE_EMAIL != true)', 'EMAIL_PROVIDER');
    }
  }

  private initialize() {
    switch (this.providerType) {
      case 'resend':    return this.initializeResend();
      case 'sendgrid':  return this.initializeSendGrid();
      case 'nodemailer': return this.initializeNodemailer();
      default:
        logger.warn('Unknown email provider, disabling', 'EMAIL_PROVIDER');
        this.enabled = false;
    }
  }

  private initializeResend() {
    const apiKey = process.env.RESEND_API_KEY!;
    this.resendClient = new Resend(apiKey);
    logger.info('Resend email provider initialized', 'EMAIL_PROVIDER');
  }

  private initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      logger.warn('SendGrid API key missing, email disabled', 'EMAIL_PROVIDER');
      this.enabled = false;
      return;
    }
    sgMail.setApiKey(apiKey);
    logger.info('SendGrid email provider initialized', 'EMAIL_PROVIDER');
  }

  private initializeNodemailer() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;

    if (!host || !user || !password) {
      logger.warn('Nodemailer config incomplete, email disabled', 'EMAIL_PROVIDER');
      this.enabled = false;
      return;
    }

    this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass: password } });
    logger.info('Nodemailer email provider initialized', 'EMAIL_PROVIDER', { host, port });
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      logger.info('Email skipped (provider disabled)', 'EMAIL_PROVIDER', { to: options.to, subject: options.subject });
      return { success: false, error: 'Email provider not enabled or configured' };
    }

    switch (this.providerType) {
      case 'resend':     return this.sendWithResend(options);
      case 'sendgrid':   return this.sendWithSendGrid(options);
      case 'nodemailer': return this.sendWithNodemailer(options);
      default:           return { success: false, error: 'No valid email provider configured' };
    }
  }

  private fromAddress(override?: string): string {
    const email = override || this.fromEmail;
    return `${this.fromName} <${email}>`;
  }

  private async sendWithResend(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const payload: any = {
        from: this.fromAddress(options.from),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };
      if (options.replyTo) payload.replyTo = options.replyTo;
      if (options.attachments) {
        payload.attachments = options.attachments.map(a => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
        }));
      }
      const { data, error } = await this.resendClient!.emails.send(payload);

      if (error) {
        logger.error('Resend error', 'EMAIL_PROVIDER', { to: options.to, error });
        return { success: false, error: error.message };
      }

      logger.info('Email sent via Resend', 'EMAIL_PROVIDER', { to: options.to, subject: options.subject, id: data?.id });
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      logger.error('Resend exception', 'EMAIL_PROVIDER', { to: options.to, error: err.message });
      return { success: false, error: err.message };
    }
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
      if (options.replyTo) msg.replyTo = options.replyTo;
      if (options.attachments) {
        msg.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType,
          disposition: 'attachment',
        }));
      }
      const [response] = await sgMail.send(msg);
      logger.info('Email sent via SendGrid', 'EMAIL_PROVIDER', { to: options.to, statusCode: response.statusCode });
      return { success: true, messageId: response.headers['x-message-id'] as string };
    } catch (err: any) {
      logger.error('SendGrid error', 'EMAIL_PROVIDER', { to: options.to, error: err.message });
      return { success: false, error: err.message };
    }
  }

  private async sendWithNodemailer(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) return { success: false, error: 'Nodemailer not initialized' };
    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });
      logger.info('Email sent via Nodemailer', 'EMAIL_PROVIDER', { to: options.to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      logger.error('Nodemailer error', 'EMAIL_PROVIDER', { to: options.to, error: err.message });
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.enabled) return false;
    if (this.providerType === 'resend' || this.providerType === 'sendgrid') return true;
    if (this.providerType === 'nodemailer' && this.transporter) {
      try { await this.transporter.verify(); return true; } catch { return false; }
    }
    return false;
  }

  isEnabled(): boolean { return this.enabled; }
  getProviderType(): EmailProviderType { return this.providerType; }
}

export const emailProvider = new EmailProvider();
