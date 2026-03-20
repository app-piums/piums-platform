import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import type { RequestHandler } from "express";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import oauthRoutes from "./routes/oauth.routes";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";
import { configureGoogleStrategy } from "./strategies/google.strategy";
import { configureFacebookStrategy } from "./strategies/facebook.strategy";

const app = express();

// Configurar estrategias OAuth
configureGoogleStrategy();
configureFacebookStrategy();

// Middlewares globales
app.use(cors({ credentials: true, origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'piums-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}) as any);
app.use(passport.initialize() as any);
app.use(passport.session() as any);
app.use(apiLimiter); // Rate limiting general

// Rutas
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/auth", oauthRoutes); // OAuth routes under /auth
app.use("/admin", adminRoutes);

// Middleware de error handling (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  logger.info(`Auth Service running on http://localhost:${PORT}`, "SERVER");
  logger.info(`Health check: http://localhost:${PORT}/health`, "SERVER");
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`, "SERVER");
});