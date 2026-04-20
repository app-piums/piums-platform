import rateLimit from "express-rate-limit";

// Rate limiter para login: clave por IP+email para no bloquear toda la IP compartida
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana por clave IP+email
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    return `login:${req.ip}:${email}`;
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
  max: process.env.NODE_ENV === "development" ? 200 : 3,
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
  max: process.env.NODE_ENV === "development" ? 10000 : 100,
  message: {
    status: "error",
    message: "Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter agresivo para forgot-password
 * 3 intentos por hora por IP
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 requests por hora
  message: {
    status: "error",
    message: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter para reset-password
 * 5 intentos cada 15 minutos por IP
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    status: "error",
    message: 'Demasiados intentos de reseteo de contraseña. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para email verification resend
 * 3 intentos cada 10 minutos por IP
 */
export const resendVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 3,
  message: {
    status: "error",
    message: 'Demasiados intentos de reenvío. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para refresh token
 * 10 intentos cada 5 minutos por IP
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10,
  message: {
    status: "error",
    message: 'Demasiados intentos de renovación de token. Por favor, intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

