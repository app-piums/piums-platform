import { Router } from "express";
import { paymentController } from "../controller/payment.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { createPaymentLimiter, refundLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

// ==================== CHECKOUT UNIFICADO (Tilopay / Stripe) ====================

// Inicia checkout enrutando al proveedor correcto según país del usuario
router.post(
  "/checkout",
  authenticateToken,
  createPaymentLimiter,
  paymentController.initCheckout.bind(paymentController)
);

// ==================== PAYMENT INTENTS ====================

// Crear payment intent (Stripe legacy)
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

// Estadísticas (debe ir ANTES de /:id para evitar route shadowing)
router.get(
  "/payments/stats",
  authenticateToken,
  paymentController.getPaymentStats.bind(paymentController)
);

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

// ==================== TILOPAY REDIRECT CONFIRM ====================

// Confirmar pago Tilopay recibido via redirect (frontend llama tras volver de Tilopay)
router.post(
  "/tilopay/confirm",
  authenticateToken,
  paymentController.confirmTilopayRedirect.bind(paymentController)
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
