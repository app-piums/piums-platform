import rateLimit from "express-rate-limit";

// Rate limiter general para todas las rutas
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "development" ? 500 : 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para creación de perfil de artista
export const createArtistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === "development" ? 50 : 3,
  message: "Límite de creación de perfiles alcanzado, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para actualizaciones
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 actualizaciones por hora
  message: "Límite de actualizaciones alcanzado, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para búsquedas
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 búsquedas por ventana
  message: "Límite de búsquedas alcanzado, intenta más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});
