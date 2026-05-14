import rateLimit from "express-rate-limit";
import type { Request } from "express";

// Normaliza IPv4-mapped IPv6 (::ffff:1.2.3.4) a IPv4 puro
const normalizeIp = (req: Request): string =>
  (req.ip || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');

// Desactiva validaciones de express-rate-limit v8 (no aplican detrás del proxy K8s/gateway)
const noValidate = { validate: false as any };

// Rate limiter para login: clave por IP+email para no bloquear toda la IP compartida
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  ...noValidate,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    return `login:${normalizeIp(req)}:${email}`;
  },
  message: {
    status: "error",
    message: "Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter para registro: Límite estricto (relajado en development para seed/testing)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === "development" ? 50 : 3,
  ...noValidate,
  keyGenerator: normalizeIp,
  message: {
    status: "error",
    message: "Demasiados intentos de registro. Por favor intenta nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para la API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "development" ? 500 : 100,
  ...noValidate,
  keyGenerator: normalizeIp,
  message: {
    status: "error",
    message: "Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  ...noValidate,
  keyGenerator: normalizeIp,
  message: {
    status: "error",
    message: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  ...noValidate,
  keyGenerator: normalizeIp,
  message: {
    status: "error",
    message: 'Demasiados intentos de reseteo de contraseña. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 3,
  ...noValidate,
  keyGenerator: normalizeIp,
  message: {
    status: "error",
    message: 'Demasiados intentos de reenvío. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// El cliente ya autenticó, solo renueva sesión. Apps móviles refrescan frecuentemente.
export const refreshTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 30,
  ...noValidate,
  keyGenerator: normalizeIp,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: 'Demasiados intentos de renovación de token. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
