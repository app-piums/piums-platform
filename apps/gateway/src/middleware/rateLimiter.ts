import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// Rate limiter global para todo el gateway
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "2000"), // 2000 requests por ventana
  message: {
    error: "Too Many Requests",
    message: "You have exceeded the request limit. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, "RATE_LIMITER", {
      ip: req.ip,
      url: req.url,
    });
    
    res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded the request limit. Please try again later.",
      retryAfter: res.getHeader("RateLimit-Reset"),
    });
  },
});

// Rate limiter específico para autenticación (más estricto)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: {
    error: "Too Many Requests",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
