import rateLimit from "express-rate-limit";
import { RequestHandler } from "express";

const asRequestHandler = (handler: ReturnType<typeof rateLimit>): RequestHandler =>
  handler as unknown as RequestHandler;

export const apiLimiter: RequestHandler = asRequestHandler(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { status: "error", message: "Demasiados requests desde esta IP, por favor intenta más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// El endpoint /check es llamado por otros servicios en tiempo real — límite más generoso
export const checkLimiter: RequestHandler = asRequestHandler(
  rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    message: { status: "error", message: "Rate limit excedido en endpoint de moderación." },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

export const adminLimiter: RequestHandler = asRequestHandler(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { status: "error", message: "Demasiados requests de administración." },
    standardHeaders: true,
    legacyHeaders: false,
  })
);
