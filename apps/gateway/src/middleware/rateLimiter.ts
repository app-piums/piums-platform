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

// Rate limiter para login con email/password (estricto)
// Excluye OAuth, refresh y firebase — tienen sus propios limiters en auth-service
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: {
    error: "Too Many Requests",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => /\/(google|facebook|tiktok|refresh|firebase|complete-onboarding|me|logout)/.test(req.path),
});

// Rate limiter para OAuth (Google, Facebook, TikTok) — más permisivo
// Google/FB manejan su propia seguridad; aquí solo prevenimos abuso masivo
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `oauth:${req.ip}`,
  message: {
    error: "Too Many Requests",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para refresh de token — el cliente ya autenticó, solo renueva sesión
// Permisivo: apps móviles refrescan al abrir la app, volver de background, etc.
export const refreshRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `refresh:${req.ip}`,
  message: {
    error: "Too Many Requests",
    message: "Too many token refresh attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
