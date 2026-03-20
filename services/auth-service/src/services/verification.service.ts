import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export class VerificationService {
  /**
   * Genera un token seguro para verificación de email
   */
  private generateVerificationToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  /**
   * Hash de un token para comparación
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Crear token de verificación para un usuario
   */
  async createVerificationToken(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Invalidar tokens anteriores para este email
      await prisma.emailVerification.updateMany({
        where: {
          userId,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      // Generar nuevo token
      const { token, tokenHash } = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Guardar en BD
      await prisma.emailVerification.create({
        data: {
          userId,
          email,
          tokenHash,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      logger.info('Email verification token created', 'VERIFICATION_SERVICE', { userId, email });

      return {
        success: true,
        token,
        expiresAt,
      };
    } catch (error: any) {
      logger.error('Error creating verification token', 'VERIFICATION_SERVICE', error);
      throw error;
    }
  }

  /**
   * Verificar email con token
   */
  async verifyEmail(token: string, ipAddress?: string, userAgent?: string) {
    try {
      const tokenHash = this.hashToken(token);

      const verificationRecord = await prisma.emailVerification.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!verificationRecord) {
        throw new AppError(400, 'Token de verificación inválido');
      }

      // Verificar si ya fue usado
      if (verificationRecord.status === 'USED') {
        throw new AppError(400, 'Este token ya fue utilizado');
      }

      // Verificar si fue revocado
      if (verificationRecord.status === 'REVOKED') {
        throw new AppError(400, 'Este token ha sido revocado');
      }

      // Verificar expiración
      if (new Date() > verificationRecord.expiresAt) {
        await prisma.emailVerification.update({
          where: { id: verificationRecord.id },
          data: { status: 'EXPIRED' },
        });
        throw new AppError(400, 'Token expirado. Solicita un nuevo email de verificación');
      }

      // Verificar el email del usuario
      const user = await prisma.user.update({
        where: { id: verificationRecord.userId },
        data: {
          emailVerified: true,
          status: verificationRecord.user.status === 'PENDING_EMAIL' ? 'ACTIVE' : verificationRecord.user.status,
        },
      });

      // Marcar token como usado
      await prisma.emailVerification.update({
        where: { id: verificationRecord.id },
        data: {
          status: 'USED',
          verifiedAt: new Date(),
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          entity: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          success: true,
        },
      });

      logger.info('Email verified successfully', 'VERIFICATION_SERVICE', { userId: user.id });

      return {
        success: true,
        message: 'Email verificado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          status: user.status,
        },
      };
    } catch (error: any) {
      logger.error('Error verifying email', 'VERIFICATION_SERVICE', error);
      throw error;
    }
  }

  /**
   * Reenviar email de verificación
   */
  async resendVerification(email: string, ipAddress?: string, userAgent?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Por seguridad, no revelamos si el email existe
      if (!user) {
        logger.warn('Verification resend requested for non-existent email', 'VERIFICATION_SERVICE', { email });
        return { success: true, emailSent: false };
      }

      // Verificar si ya está verificado
      if (user.emailVerified) {
        return {
          success: true,
          emailSent: false,
          message: 'Email ya verificado',
        };
      }

      // Verificar que el usuario esté activo o pendiente de verificación
      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        throw new AppError(403, 'Esta cuenta está suspendida');
      }

      // Crear nuevo token
      const result = await this.createVerificationToken(user.id, email, ipAddress, userAgent);

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'VERIFICATION_RESEND_REQUESTED',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      return {
        success: true,
        emailSent: true,
        token: result.token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
        },
        expiresAt: result.expiresAt,
      };
    } catch (error: any) {
      logger.error('Error resending verification', 'VERIFICATION_SERVICE', error);
      throw error;
    }
  }

  /**
   * Verificar si un email necesita verificación
   */
  async needsVerification(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      });

      return user ? !user.emailVerified : true;
    } catch (error: any) {
      logger.error('Error checking verification status', 'VERIFICATION_SERVICE', error);
      return true;
    }
  }
}

export const verificationService = new VerificationService();
