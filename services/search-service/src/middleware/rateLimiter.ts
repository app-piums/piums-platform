import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

const asRequestHandler = (h: ReturnType<typeof rateLimit>): RequestHandler =>
  h as unknown as RequestHandler;

const isDev = process.env.NODE_ENV !== "production";
const skipInDev = () => isDev;

// General API rate limiter
export const apiLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));

// Search rate limiter (more permissive)
export const searchLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Demasiadas búsquedas, por favor espera un momento',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
}));

// Autocomplete rate limiter (very permissive for UX)
export const autocompleteLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 autocomplete requests per minute
  message: 'Demasiadas solicitudes de autocompletado',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  skipSuccessfulRequests: true,
}));

// Index management rate limiter (restrictive)
export const indexLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 index operations per hour
  message: 'Límite de operaciones de indexación alcanzado',
  standardHeaders: true,
  legacyHeaders: false,
}));
