import "dotenv/config";
import express from "express";
import cors from "cors";
import moderationRoutes from "./routes/moderation.routes";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

const app = express();
app.set("trust proxy", 1);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — sin rate limiting para probes de K8s/Docker
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "moderation-service" });
});

// Rate limiting general
app.use(apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, "REQUEST");
  next();
});

// Routes
app.use("/api/moderation", moderationRoutes);

// Error handling
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || "4011", 10);

const server = app.listen(PORT, () => {
  logger.info(`Moderation Service running on port ${PORT}`, "SERVER");
});

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    logger.info("Server closed gracefully", "SERVER");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
