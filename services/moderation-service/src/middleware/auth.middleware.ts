import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { logger } from "../utils/logger";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  logger.error("FATAL: JWT_SECRET no definido en produccion", "AUTH_MIDDLEWARE");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-not-for-production";

interface JwtPayload {
  id?: string;
  userId?: string;
  role?: string;
  isService?: boolean;
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

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) throw new AppError(401, "Token de autenticación no proporcionado");

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError") return next(new AppError(401, "Token inválido"));
      if (error.name === "TokenExpiredError") return next(new AppError(401, "Token expirado"));
    }
    next(error);
  }
};

/**
 * Permite acceso a admins humanos O a service tokens internos
 */
export const requireAdminOrService = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(401, "No autenticado"));
  if (req.user.role === "admin" || req.user.isService === true) return next();
  return next(new AppError(403, "Acceso denegado"));
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError(403, "Acceso denegado: se requiere rol de administrador"));
  }
  next();
};
