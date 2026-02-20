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
 * Middleware para verificar JWT
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

    const token = authHeader.substring(7);

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
 * Middleware opcional para autenticación (no falla si no hay token)
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Si falla la autenticación opcional, continuamos sin usuario
    next();
  }
};
