import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('FATAL: JWT_SECRET no definido en produccion', 'AUTH_MIDDLEWARE');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * Middleware para verificar JWT
 */
export const internalAuth: RequestHandler = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return next(new AppError(403, "Forbidden"));
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de administrador.'));
  }
  next();
};

export const authenticateToken: RequestHandler = (
  req,
  res,
  next
) => {
  try {
    const authReq = req as AuthRequest;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Token de autenticación no proporcionado");
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    authReq.user = decoded;
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
 * Middleware de revocación de sesión (PII-M6).
 * Debe usarse DESPUÉS de authenticateToken en rutas sensibles.
 * Verifica contra auth-service que el JTI del token siga activo.
 * Falla abierto (fail-open) si auth-service no responde, para no
 * bloquear operaciones cuando el servicio de auth está caído.
 */
export const requireActiveSession: RequestHandler = async (req, res, next) => {
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
