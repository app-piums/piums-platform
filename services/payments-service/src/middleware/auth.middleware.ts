import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('FATAL: JWT_SECRET no definido en produccion', 'AUTH_MIDDLEWARE');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';

interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError(401, "Token de autenticación no proporcionado");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError(401, "Token inválido"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expirado"));
    }
    next(error);
  }
};

// Middleware para llamadas internas entre servicios (x-internal-secret)
export const internalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const secret = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || '';
  if (!secret || secret !== expectedSecret) {
    return next(new AppError(403, 'Acceso interno denegado'));
  }
  next();
};

// Middleware opcional de autenticación
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Si falla la verificación, continuar sin usuario
    next();
  }
};

/**
 * Middleware de revocación de sesión (PII-M6).
 * Debe usarse DESPUÉS de authenticateToken en rutas sensibles.
 * Verifica contra auth-service que el JTI del token siga activo.
 * Falla abierto (fail-open) si auth-service no responde, para no
 * bloquear operaciones cuando el servicio de auth está caído.
 */
export const requireActiveSession: RequestHandler = async (req, _res, next) => {
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
