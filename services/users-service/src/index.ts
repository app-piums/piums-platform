import "dotenv/config";
import express from "express";
import cors from "cors";
import usersRoutes from "./routes/users.routes";
import profileRoutes from "./routes/profile.routes";
import favoriteRoutes from "./routes/favorite.routes";
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
app.use(apiLimiter as any);

// Rutas
app.use("/health", healthRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/users/me/profile", profileRoutes);
app.use("/api/users/me/favorites", favoriteRoutes);

// Middleware de error handling (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  logger.info(`Users Service running on http://localhost:${PORT}`, "SERVER");
  logger.info(`Health check: http://localhost:${PORT}/health`, "SERVER");
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`, "SERVER");
});
