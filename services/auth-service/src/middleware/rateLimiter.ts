import rateLimit from "express-rate-limit";

// Rate limiter para login: DESHABILITADO PARA DESARROLLO
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 intentos máximo (prácticamente deshabilitado)
  message: {
    status: "error",
    message: "Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para registro: DESHABILITADO PARA DESARROLLO
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 1000, // 1000 intentos máximo (prácticamente deshabilitado)
  message: {
    status: "error",
    message: "Demasiados intentos de registro. Por favor intenta nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para la API: DESHABILITADO PARA DESARROLLO
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // 10000 requests máximo (prácticamente deshabilitado)
  message: {
    status: "error",
    message: "Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
