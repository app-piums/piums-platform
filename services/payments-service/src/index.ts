import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { paymentService } from "./services/payment.service";

// Routes
import healthRoutes from "./routes/health.routes";
import paymentRoutes from "./routes/payment.routes";
import paymentMethodRoutes from "./routes/paymentMethod.routes";
import payoutRoutes from "./routes/payout.routes";
import webhookRoutes from "./routes/webhook.routes";
import creditRoutes from "./routes/credit.routes";
import commissionRoutes from "./routes/commission.routes";
import callbackRoutes from "./routes/callback.routes";

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
app.use("/api", creditRoutes);
app.use("/api", commissionRoutes);
app.use("/callbacks", callbackRoutes);

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Payments Service running on port ${PORT}`, "SERVER", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
  });

  logger.info("Payment providers loaded", "SERVER", {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    tilopay: !!process.env.TILOPAY_API_KEY,
    defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
    platformFee: `${process.env.PLATFORM_FEE_PERCENTAGE || 18}%`,
  });
});

// Cron diario: expirar créditos vencidos (se ejecuta cada 24h)
setInterval(async () => {
  try {
    const count = await paymentService.expireCredits();
    if (count > 0) logger.info(`Cron: expired ${count} credits`, "CREDIT_CRON");
  } catch (err: any) {
    logger.error("Error en cron de expiración de créditos", "CREDIT_CRON", { error: err.message });
  }
}, 24 * 60 * 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server", "SERVER");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server", "SERVER");
  process.exit(0);
});
