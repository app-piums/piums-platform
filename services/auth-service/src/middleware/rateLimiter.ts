import rateLimit from "express-rate-limit";

// Rate limiter para login: 5 intentos por 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: {
    status: "error",
    message: "Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para registro: 3 intentos por hora
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos máximo
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
  max: 100, // 100 requests máximo
  message: {
    status: "error",
    message: "Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
