import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import { logger } from "../utils/logger";

// Shared Redis client for distributed rate limiting (optional — falls back to memory store)
let redisClient: Redis | null = null;
if (process.env.REDIS_HOST) {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
  redisClient.on("error", (err: Error) => logger.error("Rate-limit Redis error", "RATE_LIMITER", { error: err.message }));
  redisClient.connect().catch((err: Error) => logger.warn("Rate-limit Redis connect failed, using memory store", "RATE_LIMITER", { error: err.message }));
}

function makeStore(prefix: string) {
  if (redisClient) {
    return new RedisStore({
      // ioredis `.call` typing requires a fixed first arg; cast to a rest-parameter
      // signature so spreading the string[] is valid (fixes TS2556).
      sendCommand: (...args: string[]) =>
        (redisClient!.call as (...a: string[]) => Promise<unknown>)(...args) as any,
      prefix,
    });
  }
  return undefined;
}

// Rate limiter global para todo el gateway
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "2000"), // 2000 requests por ventana
  store: makeStore("rl:global:"),
  message: {
    error: "Too Many Requests",
    message: "You have exceeded the request limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Health probes and Socket.IO polling must never be rate-limited.
  // Health: kubelet hits /api/health/ping every 10-20s — a 429 causes K8s to restart the pod.
  // Socket.IO: polling makes many HTTP requests per connection; WS upgrades bypass this limiter.
  skip: (req) => req.path.startsWith('/socket.io') || req.path.startsWith('/api/health'),
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
  store: makeStore("rl:auth:"),
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
  store: makeStore("rl:oauth:"),
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
  store: makeStore("rl:refresh:"),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `refresh:${req.ip}`,
  message: {
    error: "Too Many Requests",
    message: "Too many token refresh attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para upload de documentos KYC — bodies grandes (hasta 10mb)
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  store: makeStore("rl:upload:"),
  keyGenerator: (req) => `upload:${req.ip}`,
  message: {
    error: "Too Many Requests",
    message: "Too many upload attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
