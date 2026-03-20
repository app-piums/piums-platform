import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";

// Routes
import healthRoutes from "./routes/health.routes";
import paymentRoutes from "./routes/payment.routes";
import paymentMethodRoutes from "./routes/paymentMethod.routes";
import payoutRoutes from "./routes/payout.routes";
import webhookRoutes from "./routes/webhook.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4007;

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// IMPORTANTE: Webhook de Stripe necesita body raw
// Antes de agregar express.json(), registrar la ruta de webhook
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Body parsing (después del webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, "HTTP", {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

// Routes
app.use("/health", healthRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments", paymentMethodRoutes);
app.use("/api", payoutRoutes);

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Payments Service running on port ${PORT}`, "SERVER", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
  });

  // Log stripe configuration
  logger.info("Stripe configuration loaded", "SERVER", {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server", "SERVER");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server", "SERVER");
  process.exit(0);
});
