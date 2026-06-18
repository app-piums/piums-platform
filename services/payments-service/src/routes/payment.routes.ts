import { Router, Request, Response, NextFunction } from "express";
import { paymentController } from "../controller/payment.controller";
import { authenticateToken, requireActiveSession } from "../middleware/auth.middleware";
import { createPaymentLimiter, refundLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

// ==================== CHECKOUT UNIFICADO (Tilopay / Stripe) ====================

// Inicia checkout enrutando al proveedor correcto según país del usuario
router.post(
  "/checkout",
  authenticateToken,
  requireActiveSession,
  createPaymentLimiter,
  paymentController.initCheckout.bind(paymentController)
);

// Inicia checkout para compra de boletos (ticketMode — sin ownership check de booking)
router.post(
  "/ticket-checkout",
  authenticateToken,
  requireActiveSession,
  createPaymentLimiter,
  paymentController.initTicketCheckout.bind(paymentController)
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

// ==================== INTERNAL: CAPTURE / VOID (inter-servicio) ====================

const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};

// Cobrar saldo restante con tarjeta guardada (cron 72h pre-evento)
router.post(
  "/internal/charge-remaining/:bookingId",
  internalAuth,
  paymentController.chargeRemainingBalance.bind(paymentController)
);

// Capturar pago pre-autorizado (artista confirmó la reserva)
router.post(
  "/internal/capture-booking/:bookingId",
  internalAuth,
  paymentController.captureBookingPayment.bind(paymentController)
);

// Liberar pre-autorización (artista rechazó o no confirmó)
router.post(
  "/internal/void-booking/:bookingId",
  internalAuth,
  paymentController.voidBookingPayment.bind(paymentController)
);

// Cobrar anticipo con tarjeta guardada al confirmar (cliente sin pre-auth)
router.post(
  "/internal/charge-deposit/:bookingId",
  internalAuth,
  paymentController.chargeDepositWithSavedCard.bind(paymentController)
);

export default router;
