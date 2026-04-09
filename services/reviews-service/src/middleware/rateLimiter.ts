import rateLimit from "express-rate-limit";
import { RequestHandler } from "express";

const asRequestHandler = (handler: ReturnType<typeof rateLimit>): RequestHandler =>
  handler as unknown as RequestHandler;

// Rate limiter general para la API
export const apiLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: { status: 'error', message: 'Demasiados requests desde esta IP, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rate limiter para crear reseñas (más restrictivo)
export const createReviewLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 reseñas por hora
  message: { status: 'error', message: 'Has creado demasiadas reseñas recientemente. Intenta más tarde.' },
  skipSuccessfulRequests: true,
}));

// Rate limiter para responder reseñas (artistas)
export const responseReviewLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 respuestas por hora
  message: { status: 'error', message: 'Has respondido demasiadas reseñas recientemente. Intenta más tarde.' },
}));

// Rate limiter para reportar reseñas
export const reportReviewLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 10, // Máximo 10 reportes por día
  message: { status: 'error', message: 'Has reportado demasiadas reseñas hoy. Intenta mañana.' },
}));

// Rate limiter para marcar como útil
export const markHelpfulLimiter: RequestHandler = asRequestHandler(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 votos por hora
  message: "Demasiados votos. Intenta más tarde.",
}));
