import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

interface RefreshTokenPayload {
  id: string;
  jti: string;
}

interface AccessTokenPayload {
  id: string;
  email: string;
  jti: string;
  role?: string;
}

export class TokenService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!secret || !refreshSecret) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('FATAL: JWT_SECRET / JWT_REFRESH_SECRET no definidos en producción', 'TOKEN_SERVICE');
        process.exit(1);
      }
      logger.warn('JWT secrets no definidos — usando placeholders de desarrollo (NO USAR EN PRODUCCIÓN)', 'TOKEN_SERVICE');
    }

    this.JWT_SECRET = secret || 'dev_jwt_CHANGE_ME_NOT_FOR_PRODUCTION';
    this.JWT_REFRESH_SECRET = refreshSecret || 'dev_refresh_CHANGE_ME_NOT_FOR_PRODUCTION';
  }
  private readonly JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
  private readonly JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

  /**
   * Genera un hash SHA-256 del token
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calcula la fecha de expiración basada en el tiempo JWT
   */
  private calculateExpiry(expiryString: string): Date {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1));
    
    let milliseconds = 0;
    switch (unit) {
      case 's': milliseconds = value * 1000; break;
      case 'm': milliseconds = value * 60 * 1000; break;
      case 'h': milliseconds = value * 60 * 60 * 1000; break;
      case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
      default: milliseconds = 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }
    
    return new Date(Date.now() + milliseconds);
  }

  /**
   * Genera un access token JWT
   */
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Genera un refresh token JWT
   */
  signRefreshToken(payload: { id: string; jti: string }): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Verifica un access token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error: any) {
      throw new AppError(401, 'Token inválido o expirado');
    }
  }

  /**
   * Verifica un refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error: any) {
      throw new AppError(401, 'Refresh token inválido o expirado');
    }
  }

  /**
   * Crea un refresh token en la base de datos
   */
  async createRefreshToken(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string
  ) {
    try {
      const tokenHash = this.hashToken(refreshToken);
      const expiresAt = this.calculateExpiry(this.JWT_REFRESH_EXPIRY);

      const tokenRecord = await prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
          ipAddress,
          userAgent,
          deviceId,
        },
      });

      logger.info('Refresh token created', 'TOKEN_SERVICE', { userId, tokenId: tokenRecord.id });

      return tokenRecord;
    } catch (error: any) {
      logger.error('Error creating refresh token', 'TOKEN_SERVICE', error);
      throw error;
    }
  }

  /**
   * Valida un refresh token en la base de datos
   */
  async validateRefreshToken(refreshToken: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Primero verificar la firma JWT
      const payload = this.verifyRefreshToken(refreshToken);
      
      const tokenHash = this.hashToken(refreshToken);

      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!tokenRecord) {
        logger.warn('Refresh token not found in database', 'TOKEN_SERVICE');
        return { valid: false };
      }

      // Verificar si está revocado
      if (tokenRecord.isRevoked) {
        logger.warn('Attempt to use revoked refresh token', 'TOKEN_SERVICE', { tokenId: tokenRecord.id });
        return { valid: false };
      }

      // Verificar expiración
      if (new Date() > tokenRecord.expiresAt) {
        logger.warn('Attempt to use expired refresh token', 'TOKEN_SERVICE', { tokenId: tokenRecord.id });
        return { valid: false };
      }

      // Verificar que el userId coincida
      if (tokenRecord.userId !== payload.id) {
        logger.error('Token userId mismatch', 'TOKEN_SERVICE');
        return { valid: false };
      }

      return { valid: true, userId: tokenRecord.userId };
    } catch (error: any) {
      logger.error('Error validating refresh token', 'TOKEN_SERVICE', error);
      return { valid: false };
    }
  }

  /**
   * Rota (reemplaza) un refresh token
   * Esto es una práctica de seguridad recomendada
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string
  ) {
    try {
      // Validar el token actual
      const validation = await this.validateRefreshToken(oldRefreshToken);
      if (!validation.valid || !validation.userId) {
        throw new AppError(401, 'Refresh token inválido');
      }

      const userId = validation.userId;
      const oldTokenHash = this.hashToken(oldRefreshToken);

      // Revocar el token antiguo
      await prisma.refreshToken.update({
        where: { tokenHash: oldTokenHash },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Obtener usuario para generar nuevo access token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new AppError(404, 'Usuario no encontrado');
      }

      // Generar nuevos tokens
      const jti = crypto.randomUUID();
      const newAccessToken = this.signAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        jti,
      });
      const newRefreshToken = this.signRefreshToken({ id: user.id, jti });

      // Guardar el nuevo refresh token
      await this.createRefreshToken(userId, newRefreshToken, ipAddress, userAgent, deviceId);

      // Crear o actualizar sesión
      await prisma.session.upsert({
        where: { jti },
        create: {
          jti,
          userId,
          ipAddress,
          userAgent,
          deviceId,
          expiresAt: this.calculateExpiry(this.JWT_EXPIRY),
        },
        update: {
          lastActivity: new Date(),
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REFRESH_TOKEN_ROTATED',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      logger.info('Refresh token rotated successfully', 'TOKEN_SERVICE', { userId });

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      logger.error('Error rotating refresh token', 'TOKEN_SERVICE', error);
      throw error;
    }
  }

  /**
   * Revoca todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: string) {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // También revocar sesiones
      await prisma.session.updateMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      logger.info('All user tokens revoked', 'TOKEN_SERVICE', { userId });

      return { success: true };
    } catch (error: any) {
      logger.error('Error revoking user tokens', 'TOKEN_SERVICE', error);
      throw error;
    }
  }

  /**
   * Revoca un refresh token específico
   */
  async revokeRefreshToken(refreshToken: string) {
    try {
      const tokenHash = this.hashToken(refreshToken);

      await prisma.refreshToken.update({
        where: { tokenHash },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      logger.info('Refresh token revoked', 'TOKEN_SERVICE');

      return { success: true };
    } catch (error: any) {
      logger.error('Error revoking refresh token', 'TOKEN_SERVICE', error);
      throw error;
    }
  }

  /**
   * Limpia tokens expirados (tarea de mantenimiento)
   */
  async cleanExpiredTokens() {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired tokens cleaned', 'TOKEN_SERVICE', { count: result.count });

      return { success: true, deletedCount: result.count };
    } catch (error: any) {
      logger.error('Error cleaning expired tokens', 'TOKEN_SERVICE', error);
      throw error;
    }
  }
}

export const tokenService = new TokenService();
