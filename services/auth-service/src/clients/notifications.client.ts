import axios from 'axios';
import { logger } from '../utils/logger';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4003';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface EmailTemplate {
  to: string;
  template: 'password-reset' | 'email-verification' | 'payment-confirmation' | 'review-request';
  variables: Record<string, any>;
}

export class NotificationsClient {
  /**
   * Envía un email de reset de contraseña
   */
  async sendPasswordResetEmail(email: string, userName: string, token: string) {
    try {
      const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
      const expiryTime = '1 hora';

      await this.sendEmail({
        to: email,
        template: 'password-reset',
        variables: {
          userName,
          resetLink,
          expiryTime,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info('Password reset email sent', 'NOTIFICATIONS_CLIENT', { email });
      return { success: true };
    } catch (error: any) {
      logger.error('Error sending password reset email', 'NOTIFICATIONS_CLIENT', error);
      throw error;
    }
  }

  /**
   * Envía un email de verificación
   */
  async sendVerificationEmail(email: string, userName: string, token: string) {
    try {
      const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

      await this.sendEmail({
        to: email,
        template: 'email-verification',
        variables: {
          userName,
          verificationLink,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info('Verification email sent', 'NOTIFICATIONS_CLIENT', { email });
      return { success: true };
    } catch (error: any) {
      logger.error('Error sending verification email', 'NOTIFICATIONS_CLIENT', error);
      throw error;
    }
  }

  /**
   * Envía un email de confirmación de pago
   */
  async sendPaymentConfirmationEmail(data: {
    clientEmail: string;
    clientName: string;
    transactionId: string;
    paymentDate: string;
    paymentMethod: string;
    bookingCode: string;
    artistName: string;
    serviceName: string;
    serviceDate: string;
    subtotal: string;
    platformFee: string;
    totalAmount: string;
    bookingUrl: string;
    dashboardUrl: string;
    invoiceUrl?: string;
  }) {
    try {
      await this.sendEmail({
        to: data.clientEmail,
        template: 'payment-confirmation',
        variables: {
          ...data,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info('Payment confirmation email sent', 'NOTIFICATIONS_CLIENT', { email: data.clientEmail });
      return { success: true };
    } catch (error: any) {
      logger.error('Error sending payment confirmation email', 'NOTIFICATIONS_CLIENT', error);
      throw error;
    }
  }

  /**
   * Envía un email de solicitud de review
   */
  async sendReviewRequestEmail(data: {
    clientEmail: string;
    clientName: string;
    artistName: string;
    artistAvatar?: string;
    serviceName: string;
    serviceDate: string;
    bookingCode: string;
    reviewLink: string;
    hasIncentive?: boolean;
    incentiveText?: string;
    supportLink: string;
  }) {
    try {
      await this.sendEmail({
        to: data.clientEmail,
        template: 'review-request',
        variables: {
          ...data,
          currentYear: new Date().getFullYear(),
        },
      });

      logger.info('Review request email sent', 'NOTIFICATIONS_CLIENT', { email: data.clientEmail });
      return { success: true };
    } catch (error: any) {
      logger.error('Error sending review request email', 'NOTIFICATIONS_CLIENT', error);
      throw error;
    }
  }

  /**
   * Método genérico para enviar emails al servicio de notificaciones
   */
  private async sendEmail(data: EmailTemplate) {
    try {
      const response = await axios.post(
        `${NOTIFICATIONS_SERVICE_URL}/api/notifications/send-template-email`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        logger.error('Notifications service error', 'NOTIFICATIONS_CLIENT', {
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        logger.error('Notifications service unreachable', 'NOTIFICATIONS_CLIENT');
      } else {
        logger.error('Error sending email', 'NOTIFICATIONS_CLIENT', error);
      }
      throw error;
    }
  }
}

export const notificationsClient = new NotificationsClient();
