import rateLimit from "express-rate-limit";
import { RequestHandler } from "express";

const isDev = process.env.NODE_ENV === "development";

const asRequestHandler = (handler: ReturnType<typeof rateLimit>): RequestHandler =>
  handler as unknown as RequestHandler;

// Rate limiter general
export const apiLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 10000 : 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para crear servicios
export const createServiceLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDev ? 200 : 10, // 10 servicios por hora en producción
  message: "Límite de creación de servicios alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para actualizaciones
export const updateLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDev ? 500 : 30,
  message: "Límite de actualizaciones alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para búsquedas
export const searchLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 5000 : 50,
  message: "Límite de búsquedas alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));
