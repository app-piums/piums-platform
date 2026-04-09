import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import healthRoutes from "./routes/health.routes";
import bookingRoutes from "./routes/booking.routes";
import availabilityRoutes from "./routes/availability.routes";
import disputeRoutes from "./routes/dispute.routes";
import eventRoutes from "./routes/event.routes";

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4005;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];

// ==================== MIDDLEWARES ====================

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

app.use("/health", healthRoutes);
app.use("/api", bookingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api", disputeRoutes);
app.use("/api", eventRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ==================== ERROR HANDLER ====================

app.use(errorHandler);

// ==================== SERVIDOR ====================

app.listen(PORT, () => {
  logger.info(`🚀 Booking Service running on port ${PORT}`, "SERVER", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });
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
