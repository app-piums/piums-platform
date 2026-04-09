import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { setupRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { createProxyMiddleware } from "http-proxy-middleware";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Security headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

app.use(
  cors({
    origin: (origin, callback) => {
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(globalRateLimiter);
app.use((req, res, next) => {
  if (!req.url.includes('health')) {
    logger.info(`[GATEWAY_DEBUG] Request: ${req.method} ${req.url} (Original: ${req.originalUrl})`, "GATEWAY");
  }
  next();
});
// Server Startup and WebSocket Support
// ============================================================================

setupRoutes(app);

// WebSocket Proxy logic
const chatProxy = createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || "http://localhost:4010",
  ws: true,
  changeOrigin: true,
});

const notificationsProxy = createProxyMiddleware({
  target: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4007",
  ws: true,
  changeOrigin: true,
});

httpServer.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  if (url.includes('/socket.io') || url.includes('/api/chat')) {
    chatProxy.upgrade!(req, socket as any, head);
  } else if (url.includes('/api/notifications')) {
    notificationsProxy.upgrade!(req, socket as any, head);
  }
});

app.use(errorHandler);

httpServer.listen(Number(PORT), HOST, () => {
  logger.info(`🚪 API Gateway running on http://${HOST}:${PORT}`, "GATEWAY");
  logger.info(`📋 Environment: ${process.env.NODE_ENV || "development"}`, "GATEWAY");
  logger.info("✅ Gateway ready to proxy requests (HTTP & WS)", "GATEWAY");
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
