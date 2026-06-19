import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import healthRoutes from "./routes/health.routes";
import bookingRoutes from "./routes/booking.routes";
import { startCronJobs } from "./services/cron.service";
import availabilityRoutes from "./routes/availability.routes";
import disputeRoutes from "./routes/dispute.routes";
import eventRoutes from "./routes/event.routes";
import analyticsRoutes from "./routes/analytics.routes";
import ticketEventRoutes from "./routes/ticket-event.routes";
import collaboratorRoutes from "./routes/collaborator.routes";

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4005;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];

// ==================== MIDDLEWARES ====================

// Trust the gateway proxy so req.ip reflects real client IP (needed for rate limiting)
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);
      
      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check first — exempt from rate limiting (kube probes would exhaust the limit)
app.use("/health", healthRoutes);

// Rate limiting general
app.use(apiLimiter);

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, "REQUEST", {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// ==================== RUTAS ====================
app.use("/api", bookingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api", disputeRoutes);
app.use("/api", eventRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", ticketEventRoutes);
app.use("/api", collaboratorRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ==================== ERROR HANDLER ====================

app.use(errorHandler);

// ==================== SERVIDOR ====================

// Migration guards — ensure new columns/tables exist at startup
prisma.$executeRaw`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "couponCode" VARCHAR(50)`
  .then(() => prisma.$executeRaw`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "couponDiscountAmount" INTEGER NOT NULL DEFAULT 0`)
  .then(() => logger.info("Coupon columns on bookings ensured", "STARTUP"))
  .catch((e: any) => logger.warn("Coupon columns migration", "STARTUP", { error: e.message }))
  .then(() => prisma.$executeRaw`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "travelPrice" INTEGER NOT NULL DEFAULT 0`)
  .then(() => logger.info("travelPrice column on bookings ensured", "STARTUP"))
  .catch((e: any) => logger.warn("travelPrice column migration", "STARTUP", { error: e.message }))
  .then(() => prisma.$executeRaw`CREATE TABLE IF NOT EXISTS booking_funnel_events (id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text, "sessionId" VARCHAR(100) NOT NULL, "userId" VARCHAR(36), step VARCHAR(30) NOT NULL, action VARCHAR(20) NOT NULL, "bookingId" VARCHAR(36), "artistId" VARCHAR(36), "serviceId" VARCHAR(36), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  .then(() => logger.info("booking_funnel_events table ensured", "STARTUP"))
  .catch((e: any) => logger.warn("booking_funnel_events migration", "STARTUP", { error: e.message }))
  .then(() => prisma.$executeRaw`CREATE TABLE IF NOT EXISTS replacement_searches (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, "bookingId" TEXT NOT NULL UNIQUE, "clientId" TEXT NOT NULL, category TEXT, city TEXT, "budgetCents" INTEGER NOT NULL, "scheduledDate" TIMESTAMP(3) NOT NULL, "durationMinutes" INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'AWAITING_CLIENT', "matchedServiceIds" TEXT[] DEFAULT ARRAY[]::TEXT[], "matchedArtistIds" TEXT[] DEFAULT ARRAY[]::TEXT[], "clientOptedInAt" TIMESTAMP(3), "clientNotifiedAt" TIMESTAMP(3), "artistsNotifiedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  .then(() => prisma.$executeRaw`CREATE INDEX IF NOT EXISTS replacement_searches_bookingId ON replacement_searches ("bookingId")`)
  .then(() => prisma.$executeRaw`CREATE INDEX IF NOT EXISTS replacement_searches_clientId ON replacement_searches ("clientId")`)
  .then(() => prisma.$executeRaw`CREATE INDEX IF NOT EXISTS replacement_searches_status_expiresAt ON replacement_searches (status, "expiresAt")`)
  .then(() => logger.info("replacement_searches table ensured", "STARTUP"))
  .catch((e: any) => logger.warn("replacement_searches migration", "STARTUP", { error: e.message }));

app.listen(PORT, () => {
  logger.info(`🚀 Booking Service running on port ${PORT}`, "SERVER", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });

  startCronJobs();
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection", "PROCESS", {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", "PROCESS", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
