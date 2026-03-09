import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { 
  hashPassword, 
  comparePassword
} from "../services/auth.service";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { tokenService } from "../services/token.service";
import { passwordService } from "../services/password.service";
import { verificationService } from "../services/verification.service";
import { notificationsClient } from "../clients/notifications.client";
import { prisma } from "../lib/prisma";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos con Zod
    const validatedData = registerSchema.parse(req.body);
    const { nombre, email, password } = validatedData;

    // Validar unicidad de email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Este correo electrónico ya está registrado");
    }

    // Hash de contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario con Prisma
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        passwordHash,
        emailVerified: false,
        status: 'PENDING_EMAIL', // Usuario debe verificar email
      },
    });

    logger.info("Usuario registrado exitosamente", "AUTH_CONTROLLER", { 
      userId: user.id, 
      email: user.email 
    });

    // Generar token de verificación de email
    const verificationResult = await verificationService.createVerificationToken(
      user.id,
      email,
      req.ip,
      req.get('user-agent')
    );

    // Enviar email de verificación
    try {
      await notificationsClient.sendVerificationEmail(
        email,
        nombre,
        verificationResult.token
      );
    } catch (emailError: any) {
      logger.error("Error enviando email de verificación", "AUTH_CONTROLLER", emailError);
      // No lanzamos error, el usuario puede solicitar reenvío
    }

    // Generar tokens JWT
    const jti = crypto.randomUUID();
    const token = tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      jti,
    });
    const refreshToken = tokenService.signRefreshToken({ id: user.id, jti });

    // Guardar refresh token en BD
    await tokenService.createRefreshToken(
      user.id,
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    // Crear sesión
    await prisma.session.create({
      data: {
        jti,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
      },
    });

    // Determinar URL de redirección basada en el rol del usuario
    let redirectUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
    
    if (user.role === 'artist') {
      redirectUrl = process.env.ARTIST_APP_URL || 'http://localhost:3001';
    } else if (user.role === 'admin') {
      redirectUrl = process.env.ADMIN_APP_URL || 'http://localhost:3002';
    }

    // No enviar el passwordHash al cliente
    const { passwordHash: _, ...userResponse } = user;

    res.status(201).json({ 
      user: userResponse, 
      token,
      refreshToken,
      redirectUrl,
      message: 'Usuario registrado. Por favor verifica tu email.' 
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos con Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn("Intento de login con email no registrado", "AUTH_CONTROLLER", { email });
      throw new AppError(401, "Credenciales inválidas");
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(403, `Cuenta bloqueada temporalmente. Intenta en ${minutesLeft} minutos`);
    }

    // Verificar si la cuenta está suspendida o baneada
    if (user.status === 'BANNED') {
      throw new AppError(403, "Esta cuenta ha sido suspendida permanentemente");
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError(403, "Esta cuenta está suspendida temporalmente");
    }

    // Verificar contraseña
    const isValid = await comparePassword(password, user.passwordHash);
    
    if (!isValid) {
      // Incrementar intentos fallidos
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Bloquear cuenta después de 5 intentos fallidos (15 minutos)
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          errorMessage: 'Invalid password',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
        },
      });

      logger.warn("Intento de login con contraseña incorrecta", "AUTH_CONTROLLER", { 
        userId: user.id, 
        email,
        failedAttempts 
      });

      throw new AppError(401, "Credenciales inválidas");
    }

    // Login exitoso - resetear intentos fallidos y actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    logger.info("Login exitoso", "AUTH_CONTROLLER", { userId: user.id, email });

    // Generar tokens JWT
    const jti = crypto.randomUUID();
    const token = tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      jti,
    });
    const refreshToken = tokenService.signRefreshToken({ id: user.id, jti });

    // Guardar refresh token en BD
    await tokenService.createRefreshToken(
      user.id,
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    // Crear sesión
    await prisma.session.create({
      data: {
        jti,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
      },
    });

    // Determinar URL de redirección basada en el rol del usuario
    let redirectUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';
    
    if (user.role === 'artist') {
      redirectUrl = process.env.ARTIST_APP_URL || 'http://localhost:3001';
    } else if (user.role === 'admin') {
      redirectUrl = process.env.ADMIN_APP_URL || 'http://localhost:3002';
    }

    res.json({ 
      token,
      refreshToken,
      redirectUrl,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status,
        role: user.role,
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, "Refresh token requerido");
    }

    // Rotar el refresh token (genera nuevos access y refresh tokens)
    const tokens = await tokenService.rotateRefreshToken(
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    res.json(tokens);
  } catch (error: any) {
    next(error);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Token no proporcionado");
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    const decoded = tokenService.verifyAccessToken(token);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        emailVerified: true,
        status: true,
      },
    });

    if (!user) {
      throw new AppError(401, "Usuario no encontrado");
    }

    // Retornar información del usuario
    res.json(user);
  } catch (error: any) {
    next(error);
  }
};

// ========================================
// Password Reset Endpoints
// ========================================

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, "Email requerido");
    }

    // Solicitar reset de contraseña
    const result = await passwordService.requestPasswordReset(
      email,
      req.ip,
      req.get('user-agent')
    );

    // Si el email fue enviado, enviar notificación
    if (result.emailSent && result.user) {
      try {
        await notificationsClient.sendPasswordResetEmail(
          result.user.email,
          result.user.nombre,
          result.token
        );
      } catch (emailError: any) {
        logger.error("Error enviando email de password reset", "AUTH_CONTROLLER", emailError);
        // No revelamos el error al cliente por seguridad
      }
    }

    // Siempre devolver mensaje genérico (no revelar si el email existe)
    res.json({
      message: "Si el email existe, recibirás instrucciones para resetear tu contraseña"
    });
  } catch (error: any) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError(400, "Token y nueva contraseña requeridos");
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (newPassword.length < 8) {
      throw new AppError(400, "La contraseña debe tener al menos 8 caracteres");
    }

    // Resetear contraseña
    const result = await passwordService.resetPassword(
      token,
      newPassword,
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - userId viene del middleware de autenticación
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, "Contraseña actual y nueva requeridas");
    }

    if (newPassword.length < 8) {
      throw new AppError(400, "La contraseña debe tener al menos 8 caracteres");
    }

    const result = await passwordService.changePassword(
      userId,
      currentPassword,
      newPassword,
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

// ========================================
// Email Verification Endpoints
// ========================================

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError(400, "Token de verificación requerido");
    }

    const result = await verificationService.verifyEmail(
      token,
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, "Email requerido");
    }

    const result = await verificationService.resendVerification(
      email,
      req.ip,
      req.get('user-agent')
    );

    // Si el email fue enviado, enviar notificación
    if (result.emailSent && result.user) {
      try {
        await notificationsClient.sendVerificationEmail(
          result.user.email,
          result.user.nombre,
          result.token
        );
      } catch (emailError: any) {
        logger.error("Error enviando email de verificación", "AUTH_CONTROLLER", emailError);
        // No revelamos el error al cliente
      }
    }

    res.json({
      message: "Si el email existe y no está verificado, recibirás un nuevo enlace de verificación"
    });
  } catch (error: any) {
    next(error);
  }
};

// ========================================
// Logout Endpoint
// ========================================

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Revocar el refresh token
      await tokenService.revokeRefreshToken(refreshToken);
    }

    // @ts-ignore - jti viene del token decodificado en el middleware
    const jti = req.jti;

    if (jti) {
      // Revocar la sesión
      await prisma.session.update({
        where: { jti },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });
    }

    res.json({ message: "Logout exitoso" });
  } catch (error: any) {
    next(error);
  }
};