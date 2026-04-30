import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET no definido en producción');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
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
      email: string;
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
 * Middleware para verificar que el usuario solo acceda a su propio perfil
 */
export const authorizeOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedUserId = req.params.id;
  const authenticatedUserId = req.user?.id;

  if (requestedUserId !== authenticatedUserId) {
    logger.warn("Intento de acceso no autorizado", "AUTH_MIDDLEWARE", {
      requestedUserId,
      authenticatedUserId,
    });
    return next(new AppError(403, "No tienes permisos para acceder a este recurso"));
  }

  next();
};
