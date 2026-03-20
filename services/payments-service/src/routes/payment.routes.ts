import { Router } from "express";
import { paymentController } from "../controller/payment.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { createPaymentLimiter, refundLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

// ==================== PAYMENT INTENTS ====================

// Crear payment intent
router.post(
  "/payment-intents",
  authenticateToken,
  createPaymentLimiter,
  paymentController.createPaymentIntent.bind(paymentController)
);

// Obtener payment intent por ID
router.get(
  "/payment-intents/:id",
  authenticateToken,
  paymentController.getPaymentIntent.bind(paymentController)
);

// Confirmar payment intent
router.post(
  "/payment-intents/confirm",
  authenticateToken,
  paymentController.confirmPaymentIntent.bind(paymentController)
);

// Cancelar payment intent
router.post(
  "/payment-intents/:paymentIntentId/cancel",
  authenticateToken,
  paymentController.cancelPaymentIntent.bind(paymentController)
);

// ==================== PAYMENTS ====================

// Buscar pagos
router.get(
  "/payments",
  authenticateToken,
  paymentController.searchPayments.bind(paymentController)
);

// Obtener pago por ID
router.get(
  "/payments/:id",
  authenticateToken,
  paymentController.getPaymentById.bind(paymentController)
);

// Estadísticas
router.get(
  "/payments/stats",
  authenticateToken,
  paymentController.getPaymentStats.bind(paymentController)
);

// ==================== REFUNDS ====================

// Crear refund
router.post(
  "/refunds",
  authenticateToken,
  refundLimiter,
  paymentController.createRefund.bind(paymentController)
);

// Obtener refund por ID
router.get(
  "/refunds/:id",
  authenticateToken,
  paymentController.getRefundById.bind(paymentController)
);

export default router;
