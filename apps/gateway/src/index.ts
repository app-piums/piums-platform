import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { setupRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { globalRateLimiter } from "./middleware/rateLimiter";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// ============================================================================
// Middleware
// ============================================================================

// Security headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000", // Client app
  "http://localhost:3001", // Artist app
  "http://localhost:3002", // Admin app (future)
  "http://localhost:3003", // Admin panel (web-admin)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Global rate limiting
app.use(globalRateLimiter);

// ============================================================================
// Routes
// ============================================================================

setupRoutes(app);

// ============================================================================
// Error Handling
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

app.listen(Number(PORT), HOST, () => {
  logger.info(`🚪 API Gateway running on http://${HOST}:${PORT}`, "GATEWAY");
  logger.info(`📋 Environment: ${process.env.NODE_ENV || "development"}`, "GATEWAY");
  logger.info(`🔐 CORS Origins: ${allowedOrigins.join(", ")}`, "GATEWAY");
  logger.info("✅ Gateway ready to proxy requests", "GATEWAY");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server", "GATEWAY");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server", "GATEWAY");
  process.exit(0);
});
