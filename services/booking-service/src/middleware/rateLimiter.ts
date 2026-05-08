import { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const asRequestHandler = (handler: ReturnType<typeof rateLimit>): RequestHandler =>
  handler as unknown as RequestHandler;

const isDev = process.env.NODE_ENV !== "production";
const skipInDev = () => isDev;

// Rate limiter general
export const apiLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));

// Rate limiter para crear reservas
export const createBookingLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Límite de creación de reservas alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));

// Rate limiter para actualizaciones
export const updateLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Límite de actualizaciones alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));

// Rate limiter para consultas de disponibilidad
export const availabilityLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Límite de consultas de disponibilidad alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));
