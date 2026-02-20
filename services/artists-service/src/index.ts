import "dotenv/config";
import express from "express";
import cors from "cors";
import artistsRoutes from "./routes/artists.routes";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

const app = express();

// Middlewares globales
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(apiLimiter);

// Rutas
app.use("/health", healthRoutes);
app.use("/api/artists", artistsRoutes);

// Middleware de error handling (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  logger.info(`Artists Service running on http://localhost:${PORT}`, "SERVER");
  logger.info(`Health check: http://localhost:${PORT}/health`, "SERVER");
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`, "SERVER");
});
