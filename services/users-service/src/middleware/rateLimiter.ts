import rateLimit from "express-rate-limit";

// Rate limiter general para todas las rutas
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter más estricto para actualizaciones de perfil
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 actualizaciones por hora
  message: "Límite de actualizaciones alcanzado, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para eliminación de cuenta
export const deleteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 3, // 3 intentos por día
  message: "Demasiados intentos de eliminación, contacta soporte",
  standardHeaders: true,
  legacyHeaders: false,
});
