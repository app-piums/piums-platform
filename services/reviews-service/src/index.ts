import "dotenv/config";
import express from "express";
import cors from "cors";
import reviewRoutes from "./routes/review.routes";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

const app = express();

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting general
app.use(apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, "REQUEST", {
    query: req.query,
    params: req.params,
  });
  next();
});

// Routes
app.use("/health", healthRoutes);
app.use("/api/reviews", reviewRoutes);

// Error handling (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4008;

app.listen(PORT, () => {
  logger.info(`Reviews Service running on port ${PORT}`, "SERVER", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM recibido, cerrando servidor...", "SERVER");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT recibido, cerrando servidor...", "SERVER");
  process.exit(0);
});
