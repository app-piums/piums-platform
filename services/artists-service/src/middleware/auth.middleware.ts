import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

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
 * Middleware para verificar que el usuario acceda solo a su propio perfil de artista
 */
export const authorizeArtistOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const requestedArtistId = req.params.id;
  const authenticatedUserId = req.user?.id;

  // Nota: Aquí asumimos que el ID del artista es el authId
  // En producción, deberías verificar contra la base de datos
  if (requestedArtistId !== authenticatedUserId) {
    logger.warn("Intento de acceso no autorizado a perfil de artista", "AUTH_MIDDLEWARE", {
      requestedArtistId,
      authenticatedUserId,
    });
    return next(new AppError(403, "No tienes permisos para modificar este perfil"));
  }

  next();
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
