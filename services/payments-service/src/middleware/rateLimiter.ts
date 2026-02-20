import rateLimit from "express-rate-limit";

// Rate limiter general para todas las rutas
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: "Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para creación de payment intents
export const createPaymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 payment intents por hora
  message: "Demasiados intentos de pago, intenta nuevamente en 1 hora",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para refunds
export const refundLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 refunds por hora
  message: "Demasiadas solicitudes de reembolso, intenta nuevamente en 1 hora",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para webhooks (más permisivo)
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto
  message: "Rate limit exceeded for webhooks",
  standardHeaders: true,
  legacyHeaders: false,
});
