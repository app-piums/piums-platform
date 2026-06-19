import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('FATAL: JWT_SECRET no definido en produccion', 'AUTH_MIDDLEWARE');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || (() => { if (process.env.NODE_ENV === 'production') { throw new Error('JWT_SECRET es obligatorio en produccion'); } return 'dev-only-secret-not-for-production'; })();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

/**
 * Middleware para verificar JWT y extraer información del usuario
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Token de autenticación no proporcionado");
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role?: string;
    };

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      logger.warn("Token inválido", "AUTH_MIDDLEWARE", { error: error.message });
      return next(new AppError(401, "Token inválido"));
    }
    if (error.name === "TokenExpiredError") {
      logger.warn("Token expirado", "AUTH_MIDDLEWARE");
      return next(new AppError(401, "Token expirado, por favor inicia sesión nuevamente"));
    }
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario acceda solo a su propio perfil de artista.
 * Admins pueden modificar cualquier perfil.
 */
export const authorizeArtistOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const artistId = req.params.id as string;
    const authenticatedUserId = req.user?.id;
    const userRole = req.user?.role;

    // Admins pueden modificar cualquier perfil
    if (userRole === "admin") {
      return next();
    }

    if (!authenticatedUserId) {
      return next(new AppError(401, "No autenticado"));
    }

    // Buscar el perfil de artista y comparar authId con el usuario autenticado
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) {
      return next(new AppError(404, "Perfil de artista no encontrado"));
    }

    if (artist.authId !== authenticatedUserId) {
      logger.warn("Intento de acceso no autorizado a perfil de artista", "AUTH_MIDDLEWARE", {
        artistId,
        artistAuthId: artist.authId,
        authenticatedUserId,
      });
      return next(new AppError(403, "No tienes permisos para modificar este perfil"));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware opcional: verificar que el usuario sea un artista verificado
 */
export const requireVerifiedArtist = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Esta verificación se hará en el service layer
  // Este middleware solo pasa la request
  next();
};

/**
 * Middleware de revocación de sesión (PII-M6).
 * Debe usarse DESPUÉS del middleware de autenticación en rutas sensibles.
 * Verifica contra auth-service que el JTI del token siga activo.
 * Falla abierto (fail-open) si auth-service no responde, para no
 * bloquear operaciones cuando el servicio de auth está caído.
 */
export const requireActiveSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next(new AppError(401, 'Token no proporcionado'));
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as { jti?: string } | null;
    if (!decoded?.jti) return next(); // token sin jti — omitir (legado)
    const { isJtiActive } = await import('../utils/jtiVerifier');
    const active = await isJtiActive(decoded.jti);
    if (!active) return next(new AppError(401, 'Sesión revocada. Por favor inicia sesión nuevamente.'));
    next();
  } catch (err) {
    next(err);
  }
};
