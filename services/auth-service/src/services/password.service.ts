import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export class PasswordService {
  /**
   * Genera un token seguro para reset de contraseña
   */
  private generateResetToken(): { token: string; tokenHash: string } {
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
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string) {
    try {
      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Por seguridad, no revelamos si el email existe o no
      if (!user) {
        logger.warn('Password reset requested for non-existent email', 'PASSWORD_SERVICE', { email });
        // Simulamos respuesta exitosa para no revelar información
        return { success: true, emailSent: false };
      }

      // Verificar que el usuario esté activo
      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        throw new AppError(403, 'Esta cuenta está suspendida');
      }

      // Invalidar tokens anteriores
      await prisma.passwordReset.updateMany({
        where: {
          userId: user.id,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      // Generar nuevo token
      const { token, tokenHash } = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar en BD
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      logger.info('Password reset token created', 'PASSWORD_SERVICE', { userId: user.id });

      return {
        success: true,
        emailSent: true,
        token, // Este token se enviará por email
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
        },
        expiresAt,
      };
    } catch (error: any) {
      logger.error('Error requesting password reset', 'PASSWORD_SERVICE', error);
      throw error;
    }
  }

  /**
   * Validar token de reset
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const tokenHash = this.hashToken(token);

      const resetRecord = await prisma.passwordReset.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!resetRecord) {
        return { valid: false };
      }

      // Verificar si ya fue usado
      if (resetRecord.status === 'USED') {
        logger.warn('Attempt to use already used reset token', 'PASSWORD_SERVICE');
        return { valid: false };
      }

      // Verificar si fue revocado
      if (resetRecord.status === 'REVOKED') {
        logger.warn('Attempt to use revoked reset token', 'PASSWORD_SERVICE');
        return { valid: false };
      }

      // Verificar expiración
      if (new Date() > resetRecord.expiresAt) {
        await prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { status: 'EXPIRED' },
        });
        logger.warn('Attempt to use expired reset token', 'PASSWORD_SERVICE');
        return { valid: false };
      }

      return { valid: true, userId: resetRecord.userId };
    } catch (error: any) {
      logger.error('Error validating reset token', 'PASSWORD_SERVICE', error);
      return { valid: false };
    }
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Validar token
      const validation = await this.validateResetToken(token);
      if (!validation.valid || !validation.userId) {
        throw new AppError(400, 'Token inválido o expirado');
      }

      const tokenHash = this.hashToken(token);

      // Obtener el registro de reset
      const resetRecord = await prisma.passwordReset.findUnique({
        where: { tokenHash },
      });

      if (!resetRecord) {
        throw new AppError(400, 'Token inválido');
      }

      // Hash de la nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña
      const user = await prisma.user.update({
        where: { id: validation.userId },
        data: {
          passwordHash,
          lastPasswordChange: new Date(),
          failedLoginAttempts: 0, // Resetear intentos fallidos
          lockedUntil: null, // Quitar bloqueo si existía
        },
      });

      // Marcar token como usado
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
        },
      });

      // Invalidar todas las sesiones activas por seguridad
      await prisma.session.updateMany({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      // Revocar todos los refresh tokens
      await prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      logger.info('Password reset completed successfully', 'PASSWORD_SERVICE', { userId: user.id });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error: any) {
      logger.error('Error resetting password', 'PASSWORD_SERVICE', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash ?? "");
      if (!isValid) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_CHANGE_FAILED',
            errorMessage: 'Invalid current password',
            ipAddress,
            userAgent,
            success: false,
          },
        });
        throw new AppError(401, 'Contraseña actual incorrecta');
      }

      // Hash de la nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Actualizar
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          lastPasswordChange: new Date(),
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGE_COMPLETED',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      logger.info('Password changed successfully', 'PASSWORD_SERVICE', { userId });

      return {
        success: true,
        message: 'Contraseña cambiada exitosamente',
      };
    } catch (error: any) {
      logger.error('Error changing password', 'PASSWORD_SERVICE', error);
      throw error;
    }
  }
}

export const passwordService = new PasswordService();
