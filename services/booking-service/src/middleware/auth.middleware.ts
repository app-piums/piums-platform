import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

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
