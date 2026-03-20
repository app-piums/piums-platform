import { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const asRequestHandler = (handler: ReturnType<typeof rateLimit>): RequestHandler =>
  handler as unknown as RequestHandler;

// Rate limiter general
export const apiLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para crear reservas
export const createBookingLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 reservas por hora
  message: "Límite de creación de reservas alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para actualizaciones
export const updateLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,
  message: "Límite de actualizaciones alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para consultas de disponibilidad
export const availabilityLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: "Límite de consultas de disponibilidad alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
}));
