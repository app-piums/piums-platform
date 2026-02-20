import rateLimit from "express-rate-limit";

// Rate limiter general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para crear reservas
export const createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 reservas por hora
  message: "Límite de creación de reservas alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para actualizaciones
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,
  message: "Límite de actualizaciones alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para consultas de disponibilidad
export const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: "Límite de consultas de disponibilidad alcanzado",
  standardHeaders: true,
  legacyHeaders: false,
});
