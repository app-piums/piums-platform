import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { paymentService } from "./services/payment.service";
import { notificationsClient } from "./clients/notifications.client";

// Routes
import healthRoutes from "./routes/health.routes";
import paymentRoutes from "./routes/payment.routes";
import paymentMethodRoutes from "./routes/paymentMethod.routes";
import payoutRoutes from "./routes/payout.routes";
import webhookRoutes from "./routes/webhook.routes";
import creditRoutes from "./routes/credit.routes";
import commissionRoutes from "./routes/commission.routes";
import callbackRoutes from "./routes/callback.routes";
import couponRoutes from "./routes/coupon.routes";

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
app.use("/api", couponRoutes);
app.use("/callbacks", callbackRoutes);

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Add provider column to payment_methods if it doesn't exist (schema migration guard)
const _prismaInit = new PrismaClient();
_prismaInit.$executeRaw`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'STRIPE'`
  .then(() => logger.info("payment_methods.provider column ensured", "STARTUP"))
  .catch((err: any) => logger.warn("Could not ensure payment_methods.provider column", "STARTUP", { error: err.message }))
  .finally(() => _prismaInit.$disconnect());

// Migration guards for coupons tables
const _prismaCoupons = new PrismaClient();
_prismaCoupons.$executeRaw`CREATE TABLE IF NOT EXISTS coupons (id VARCHAR(36) PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, description TEXT, "discountType" VARCHAR(20) NOT NULL, "discountValue" INTEGER NOT NULL, currency VARCHAR(10) DEFAULT 'USD', "maxUses" INTEGER, "maxUsesPerUser" INTEGER DEFAULT 1, "currentUses" INTEGER DEFAULT 0, "targetType" VARCHAR(20) DEFAULT 'GLOBAL', "targetId" VARCHAR(36), "minimumAmount" INTEGER, status VARCHAR(20) DEFAULT 'ACTIVE', "startsAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3), "createdByAdminId" VARCHAR(36) NOT NULL, "deletedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP)`
  .then(() => logger.info("coupons table ensured", "STARTUP"))
  .catch((err: any) => logger.warn("coupons table migration", "STARTUP", { error: err.message }))
  .then(() => _prismaCoupons.$executeRaw`CREATE TABLE IF NOT EXISTS coupon_uses (id VARCHAR(36) PRIMARY KEY, "couponId" VARCHAR(36) NOT NULL REFERENCES coupons(id), "userId" VARCHAR(36) NOT NULL, "bookingId" VARCHAR(36) NOT NULL, "discountApplied" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, UNIQUE("couponId", "userId", "bookingId"))`)
  .then(() => logger.info("coupon_uses table ensured", "STARTUP"))
  .catch((err: any) => logger.warn("coupon_uses table migration", "STARTUP", { error: err.message }))
  .finally(() => _prismaCoupons.$disconnect());

// Migration guards for new coupon columns
const _prismaCouponCols = new PrismaClient();
_prismaCouponCols.$executeRaw`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "maxDiscountAmount" INTEGER`
  .then(() => _prismaCouponCols.$executeRaw`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "validationCount" INTEGER DEFAULT 0`)
  .then(() => logger.info("coupon new columns ensured", "STARTUP"))
  .catch((err: any) => logger.warn("coupon columns migration", "STARTUP", { error: err.message }))
  .finally(() => _prismaCouponCols.$disconnect());

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

// Cron diario: notificar cupones que expiran en ~7 días
setInterval(async () => {
  try {
    const _prisma = new PrismaClient();
    const now = new Date();
    const in6days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const in8days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const expiringSoon = await (_prisma as any).coupon.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        expiresAt: { gte: in6days, lte: in8days },
        targetType: { in: ['CLIENT', 'ARTIST'] },
      },
    });

    for (const coupon of expiringSoon) {
      if (!coupon.targetId) continue;
      const discountText = coupon.discountType === 'PERCENTAGE'
        ? `${coupon.discountValue}%`
        : `$${(coupon.discountValue / 100).toFixed(2)}`;
      await notificationsClient.sendNotification({
        userId: coupon.targetId,
        type: 'COUPON_EXPIRING',
        channel: 'IN_APP',
        title: `Tu cupón ${coupon.code} expira pronto`,
        message: `El cupón ${coupon.code} (${discountText} de descuento) vence el ${new Date(coupon.expiresAt).toLocaleDateString('es-GT')}. ¡Úsalo antes de que expire!`,
        data: { couponCode: coupon.code, expiresAt: coupon.expiresAt },
        priority: 'normal',
      }).catch(() => {});
    }

    if (expiringSoon.length > 0) {
      logger.info(`Cron: notified ${expiringSoon.length} expiring coupons`, 'COUPON_CRON');
    }
    await _prisma.$disconnect();
  } catch (err: any) {
    logger.error("Error en cron de cupones", "COUPON_CRON", { error: err.message });
  }
}, 24 * 60 * 60 * 1000);

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
