import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { 
  hashPassword, 
  comparePassword
} from "../services/auth.service";
import { registerSchema, registerArtistSchema, registerClientSchema, loginSchema } from "../schemas/auth.schema";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { tokenService } from "../services/token.service";
import { passwordService } from "../services/password.service";
import { verificationService } from "../services/verification.service";
import { notificationsClient } from "../clients/notifications.client";
import { usersClient } from "../clients/users.client";
import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────────────────────────────────
// Helper interno: crea el usuario, genera tokens y devuelve la respuesta
// ─────────────────────────────────────────────────────────────────────────
async function createUserAndRespond(
  req: Request,
  res: Response,
  nombre: string,
  email: string,
  password: string,
  role: string,
  extra?: {
    ciudad?: string;
    birthDate?: string;
    documentType?: string;
    documentNumber?: string;
    documentFrontUrl?: string;
    documentBackUrl?: string | null;
    documentSelfieUrl?: string;
  }
) {
  // Validar unicidad de email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(409, "Este correo electrónico ya está registrado");
  }

  const passwordHash = await hashPassword(password);
  const isDev = process.env.NODE_ENV !== 'production';
  const userStatus = isDev ? 'ACTIVE' : 'PENDING_EMAIL';

  const user = await prisma.user.create({
    data: {
      nombre,
      email,
      passwordHash,
      role,             // ✅ Guardar rol correcto (artista / cliente)
      emailVerified: isDev,
      status: userStatus,
      ciudad: extra?.ciudad,
      birthDate: extra?.birthDate ? new Date(extra.birthDate) : undefined,
      documentType: extra?.documentType,
      documentNumber: extra?.documentNumber,
      documentFrontUrl: extra?.documentFrontUrl,
      documentBackUrl: extra?.documentBackUrl ?? null,
      documentSelfieUrl: extra?.documentSelfieUrl,
    },
  });

  logger.info("Usuario registrado", "AUTH_CONTROLLER", { userId: user.id, email: user.email, role: user.role });

  // Crear perfil en users-service (fire-and-forget)
  usersClient.createUserProfile({
    authId: user.id,
    email: user.email,
    nombre: user.nombre,
    ciudad: extra?.ciudad,
  });

  // For artists, also bootstrap an artist profile and trigger verification when
  // KYC documents were supplied (required for password-based artist registration).
  if (role === 'artista') {
    try {
      const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
      if (internalSecret) {
        await fetch(`${artistsUrl}/artists/internal/bootstrap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
          body: JSON.stringify({ authId: user.id, email: user.email, nombre: user.nombre }),
        }).catch(() => {});

        // If docs were provided, auto-verify (dev) / mark pending review (prod).
        if (extra?.documentFrontUrl && extra?.documentSelfieUrl) {
          await fetch(`${artistsUrl}/artists/internal/by-auth/${user.id}/verification`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
            body: JSON.stringify({}),
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      logger.warn(`Artist bootstrap/verification on register failed: ${err.message}`, 'AUTH_CONTROLLER');
    }
  }

  // Email de verificación solo en producción
  if (!isDev) {
    try {
      const verificationResult = await verificationService.createVerificationToken(
        user.id, email, req.ip, req.get('user-agent')
      );
      await notificationsClient.sendVerificationEmail(email, nombre, verificationResult.token);
    } catch (emailError: any) {
      logger.warn("No se pudo enviar email de verificación", "AUTH_CONTROLLER", { message: emailError.message });
    }
  }

  // Generar tokens
  const jti = crypto.randomUUID();
  const token = tokenService.signAccessToken({ id: user.id, email: user.email, role: user.role, jti });
  const refreshToken = tokenService.signRefreshToken({ id: user.id, jti });

  await tokenService.createRefreshToken(user.id, refreshToken, req.ip, req.get('user-agent'));
  await prisma.session.create({
    data: { jti, userId: user.id, ipAddress: req.ip, userAgent: req.get('user-agent'), expiresAt: new Date(Date.now() + 3600 * 1000) },
  });

  try {
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'USER_REGISTERED', entity: 'User', entityId: user.id, ipAddress: req.ip, userAgent: req.get('user-agent'), success: true },
    });
  } catch (auditError: any) {
    logger.warn("No se pudo crear audit log", "AUTH_CONTROLLER", { message: auditError.message });
  }

  const redirectUrl = role === 'artista'
    ? (process.env.ARTIST_APP_URL || 'http://localhost:3001')
    : (process.env.CLIENT_APP_URL || 'http://localhost:3000');

  const { passwordHash: _, ...userResponse } = user;

  return res.status(201).json({
    user: userResponse,
    token,
    refreshToken,
    redirectUrl,
    message: isDev ? 'Usuario registrado exitosamente.' : 'Usuario registrado. Por favor verifica tu email.',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// POST /auth/register  (genérico – mantiene compatibilidad)
// ─────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, email, password, role } = registerSchema.parse(req.body);
    await createUserAndRespond(req, res, nombre, email, password, role);
  } catch (error: any) {
    logger.error("Error en registro genérico", "AUTH_CONTROLLER", { message: error.message });
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// POST /auth/register/artist  → rol fijo: artista
// ─────────────────────────────────────────────────────────────────────────
export const registerArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, email, password, ciudad, birthDate, documentType, documentNumber, documentFrontUrl, documentBackUrl, documentSelfieUrl } = registerArtistSchema.parse(req.body);
    await createUserAndRespond(req, res, nombre, email, password, 'artista', {
      ciudad, birthDate, documentType, documentNumber, documentFrontUrl, documentBackUrl, documentSelfieUrl,
    });
  } catch (error: any) {
    logger.error("Error en registro de artista", "AUTH_CONTROLLER", { message: error.message });
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// POST /auth/register/client  → rol fijo: cliente
// ─────────────────────────────────────────────────────────────────────────
export const registerClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, email, password, ciudad, birthDate } = registerClientSchema.parse(req.body);
    await createUserAndRespond(req, res, nombre, email, password, 'cliente', { ciudad, birthDate });
  } catch (error: any) {
    logger.error("Error en registro de cliente", "AUTH_CONTROLLER", { message: error.message });
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
    const isValid = await comparePassword(password, user.passwordHash ?? "");
    
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

    // Dual-role support: honor requested role (from the frontend that called
    // login) so a user can sign into either client or artist dashboard.
    const requestedRole = typeof (req.body as any)?.role === 'string' ? (req.body as any).role : undefined;
    const effectiveRole = requestedRole || user.role;

    // Ensure artist profile exists when logging into the artist dashboard.
    if (effectiveRole === 'artista') {
      try {
        const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
        if (internalSecret) {
          await fetch(`${artistsUrl}/artists/internal/bootstrap`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
            },
            body: JSON.stringify({
              authId: user.id,
              email: user.email,
              nombre: user.nombre,
              avatar: user.avatar ?? undefined,
            }),
          });
        }
      } catch (bootstrapErr: any) {
        logger.warn(`Artist bootstrap on login failed: ${bootstrapErr.message}`, 'AUTH_CONTROLLER');
      }
    }

    // Generar tokens JWT
    const jti = crypto.randomUUID();
    const token = tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      role: effectiveRole,
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

    // Determinar URL de redirección basada en el rol efectivo
    let redirectUrl = process.env.CLIENT_APP_URL || 'http://localhost:3000';

    if (effectiveRole === 'artista') {
      redirectUrl = process.env.ARTIST_APP_URL || 'http://localhost:3001';
    } else if (effectiveRole === 'admin') {
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
        role: effectiveRole,
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
        role: true,
        status: true,
        avatar: true,
        ciudad: true,
        birthDate: true,
        documentType: true,
        documentNumber: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        documentSelfieUrl: true,
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
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, "Contraseña actual y nueva requeridas");
    }

    if (newPassword.length < 8) {
      throw new AppError(400, "La contraseña debe tener al menos 8 caracteres");
    }

    if (currentPassword === newPassword) {
      throw new AppError(400, "La nueva contraseña debe ser diferente a la actual");
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

// ========================================
// Get current user (requires token)
// ========================================

export const getMe = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      avatar: true,
      ciudad: true,
      birthDate: true,
      documentType: true,
      documentNumber: true,
      documentFrontUrl: true,
      documentBackUrl: true,
      documentSelfieUrl: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;
    const { ciudad, birthDate, documentType, documentNumber, documentFrontUrl, documentBackUrl, documentSelfieUrl } = req.body;

    const updateData: Record<string, unknown> = {};
    if (ciudad !== undefined) updateData.ciudad = ciudad;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (documentType !== undefined) updateData.documentType = documentType;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (documentFrontUrl !== undefined) updateData.documentFrontUrl = documentFrontUrl;
    if (documentBackUrl !== undefined) updateData.documentBackUrl = documentBackUrl ?? null;
    if (documentSelfieUrl !== undefined) updateData.documentSelfieUrl = documentSelfieUrl;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        ciudad: true,
        birthDate: true,
        documentType: true,
        documentNumber: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        documentSelfieUrl: true,
      },
    });

    // If all identity documents are present and the user is an artist, notify
    // artists-service so the artist can be (auto-)verified and surface in search.
    const hasDocs = Boolean(
      user.documentType &&
        user.documentNumber &&
        user.documentFrontUrl &&
        user.documentSelfieUrl
    );
    if (hasDocs && user.role === 'artista') {
      try {
        const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
        if (internalSecret) {
          await fetch(`${artistsUrl}/artists/internal/by-auth/${user.id}/verification`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
            },
            body: JSON.stringify({}),
          });
        }
      } catch (err: any) {
        logger.warn(`Failed to notify artist verification: ${err.message}`, 'AUTH_CONTROLLER');
      }
    }

    res.json({ user });
  } catch (error: any) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// POST /auth/firebase  — exchange Firebase ID token for a PIUMS JWT
//
// Nota: verificamos el token contra la Identity Toolkit REST API de Google
// (https://identitytoolkit.googleapis.com/v1/accounts:lookup) en lugar de
// usar firebase-admin. Ambos caminos verifican la firma del JWT contra el
// proyecto de Firebase de PIUMS; la REST API no requiere service account
// (solo FIREBASE_API_KEY pública), pesa ~0 MB adicionales y no necesita
// distribuir la clave privada del service account en los secrets del
// contenedor. Google la considera segura para intercambiar ID tokens.
// ─────────────────────────────────────────────────────────────────────────
const ALLOWED_FIREBASE_ROLES = ['cliente', 'artista'] as const;
type FirebaseRole = typeof ALLOWED_FIREBASE_ROLES[number];

export const firebaseLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken, role: rawRole = 'artista' } = req.body ?? {};

    if (!idToken || typeof idToken !== 'string') {
      throw new AppError(400, 'Firebase ID token requerido');
    }

    // Validar role antes de hacer cualquier otro trabajo
    if (typeof rawRole !== 'string' || !ALLOWED_FIREBASE_ROLES.includes(rawRole as FirebaseRole)) {
      throw new AppError(
        400,
        `Role inválido. Valores permitidos: ${ALLOWED_FIREBASE_ROLES.join(', ')}`
      );
    }
    const role: FirebaseRole = rawRole as FirebaseRole;

    // Verify the Firebase ID token using the Identity Toolkit REST API
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      throw new AppError(500, 'Firebase API key no configurada en el servidor');
    }

    const tokenInfoRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!tokenInfoRes.ok) {
      throw new AppError(401, 'Token de Google inválido o expirado');
    }

    const tokenData = await tokenInfoRes.json() as {
      users?: Array<{
        localId: string;
        email: string;
        displayName?: string;
        photoUrl?: string;
        emailVerified?: boolean;
        providerUserInfo?: Array<{
          providerId: string;
          photoUrl?: string;
          displayName?: string;
        }>;
      }>;
    };

    const firebaseUser = tokenData.users?.[0];
    if (!firebaseUser) {
      throw new AppError(401, 'Token de Google inválido o expirado');
    }

    const { localId: googleId, email, displayName: name } = firebaseUser;

    // Obtener foto de perfil: preferir provider-specific (Google) sobre top-level
    const googleProviderInfo = firebaseUser.providerUserInfo?.find(
      (p) => p.providerId === 'google.com'
    );
    const rawPicture = googleProviderInfo?.photoUrl || firebaseUser.photoUrl;
    // Google devuelve fotos con tamaño =s96-c; pedir tamaño mayor para mejor calidad
    const picture = rawPicture?.replace(/=s\d+-c$/, '=s400-c');

    if (!email) {
      throw new AppError(400, 'No se pudo obtener el email desde Google');
    }

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Actualizar googleId y avatar desde Google en cada login
      const needsUpdate =
        !user.googleId ||
        (picture && user.avatar !== picture) ||
        (name && (!user.nombre || user.nombre === user.email.split('@')[0]));
      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId ?? googleId,
            provider: user.provider ?? 'google',
            avatar: picture ?? user.avatar ?? undefined,
            nombre:
              name && (!user.nombre || user.nombre === user.email.split('@')[0])
                ? name
                : user.nombre,
          },
        });
      }

      // Check account status
      if (user.status === 'BANNED') {
        throw new AppError(403, 'Esta cuenta ha sido suspendida permanentemente');
      }
      if (user.status === 'SUSPENDED') {
        throw new AppError(403, 'Esta cuenta está suspendida temporalmente');
      }
    } else {
      // Create new account automatically via Google (role from request context)
      user = await prisma.user.create({
        data: {
          nombre: name ?? email.split('@')[0],
          email,
          googleId,
          provider: 'google',
          avatar: picture ?? undefined,
          role,
          emailVerified: true,
          status: 'ACTIVE',
          passwordHash: null,
        },
      });
      logger.info('New user via Firebase Google', 'AUTH_CONTROLLER', { userId: user.id, email });
    }

    // Dual-role support: if this login is for the artist site (role='artista'),
    // ensure an artist profile exists — regardless of whether the user was just
    // created, or already existed as a client logging in to the artist app.
    // The bootstrap endpoint is idempotent (returns existing if found).
    if (role === 'artista') {
      try {
        const artistsUrl = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
        if (internalSecret) {
          const bootstrapRes = await fetch(`${artistsUrl}/artists/internal/bootstrap`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
            },
            body: JSON.stringify({
              authId: user.id,
              email: user.email,
              nombre: user.nombre,
              avatar: user.avatar ?? undefined,
            }),
          });
          if (!bootstrapRes.ok) {
            logger.warn(
              `Artist bootstrap failed: ${bootstrapRes.status}`,
              'AUTH_CONTROLLER',
              { userId: user.id }
            );
          }
        } else {
          logger.warn('INTERNAL_SERVICE_SECRET missing; skipping artist bootstrap', 'AUTH_CONTROLLER');
        }
      } catch (bootstrapErr: any) {
        logger.error(
          `Artist bootstrap error: ${bootstrapErr.message}`,
          'AUTH_CONTROLLER',
          { userId: user.id }
        );
      }
    }

    // Issue PIUMS tokens — use the REQUESTED role so a user registered as
    // 'cliente' can also log into the artist app (and vice versa).
    const effectiveRole = role || user.role;
    const jti = crypto.randomUUID();
    const token = tokenService.signAccessToken({ id: user.id, email: user.email, role: effectiveRole, jti });
    const refreshToken = tokenService.signRefreshToken({ id: user.id, jti });

    await tokenService.createRefreshToken(user.id, refreshToken, req.ip, req.get('user-agent'));
    await prisma.session.create({
      data: { jti, userId: user.id, ipAddress: req.ip, userAgent: req.get('user-agent'), expiresAt: new Date(Date.now() + 3600 * 1000) },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: req.ip } });

    const { passwordHash: _, ...userBase } = user;
    // Expose the effective role in the response so the frontend opens the
    // correct dashboard even when the user's stored role differs.
    // Also expose `_id` (alias de `id`) for iOS/mobile clients que lo esperan.
    const userResponse = { ...userBase, _id: user.id, role: effectiveRole };

    logger.info('Firebase Google login success', 'AUTH_CONTROLLER', { userId: user.id, role: effectiveRole });

    return res.json({ user: userResponse, token, refreshToken, isNewUser: !user.lastLoginAt || user.lastLoginAt.getTime() === user.createdAt.getTime() });
  } catch (error: any) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// PATCH /auth/complete-onboarding  — marca el onboarding como completado
// ─────────────────────────────────────────────────────────────────────────
export const completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as any).user;

    const user = await prisma.user.update({
      where: { id },
      data: { onboardingCompletedAt: new Date() },
      select: { id: true, onboardingCompletedAt: true },
    });

    logger.info('Onboarding completed', 'AUTH_CONTROLLER', { userId: id });
    res.json({ user });
  } catch (error: any) {
    next(error);
  }
};