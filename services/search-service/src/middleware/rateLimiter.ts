import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiter (more permissive)
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Demasiadas búsquedas, por favor espera un momento',
  standardHeaders: true,
  legacyHeaders: false,
});

// Autocomplete rate limiter (very permissive for UX)
export const autocompleteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 autocomplete requests per minute
  message: 'Demasiadas solicitudes de autocompletado',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Index management rate limiter (restrictive)
export const indexLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 index operations per hour
  message: 'Límite de operaciones de indexación alcanzado',
  standardHeaders: true,
  legacyHeaders: false,
});
