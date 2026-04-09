import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_CHANGE_ME";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header Authorization o de las cookies
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers.cookie) {
      // Intento manual de parsear cookies si no hay cookie-parser
      const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies['auth_token'] || cookies['token'];
    }

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No authorization token provided",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Adjuntar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      ...decoded,
    };

    logger.debug(`User authenticated: ${decoded.email}`, "AUTH_MIDDLEWARE");
    
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    logger.error(`Authentication error: ${error.message}`, "AUTH_MIDDLEWARE");
    
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

// Middleware opcional: no bloquea si no hay token, pero lo valida si existe
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        ...decoded,
      };
    } catch (error) {
      // Ignorar errores de token en modo opcional
      logger.debug("Optional auth: invalid token, continuing without auth", "AUTH_MIDDLEWARE");
    }
  }

  next();
};
