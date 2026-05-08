import { Router, RequestHandler } from "express";
import { paymentMethodController } from "../controller/paymentMethod.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { createPaymentLimiter } from "../middleware/rateLimiter";

const router: Router = Router();
const auth = authenticateToken as RequestHandler;
const asHandler = (fn: Function): RequestHandler => fn as unknown as RequestHandler;

// ==================== PAYMENT METHODS ====================

/**
 * GET /api/payments/methods
 * Obtener métodos de pago del usuario
 */
router.get(
  "/methods",
  auth,
  asHandler(paymentMethodController.getPaymentMethods)
);

/**
 * POST /api/payments/methods
 * Agregar nuevo método de pago
 */
router.post(
  "/methods",
  auth,
  createPaymentLimiter,
  asHandler(paymentMethodController.addPaymentMethod)
);

/**
 * DELETE /api/payments/methods/:id
 * Eliminar método de pago
 */
router.delete(
  "/methods/:id",
  auth,
  asHandler(paymentMethodController.deletePaymentMethod)
);

/**
 * PATCH /api/payments/methods/:id/default
 * Establecer método como predeterminado
 */
router.patch(
  "/methods/:id/default",
  auth,
  asHandler(paymentMethodController.setDefaultPaymentMethod)
);

/**
 * GET /api/payments/methods/default
 * Obtener método de pago predeterminado del usuario
 */
router.get(
  "/methods/default",
  auth,
  asHandler(paymentMethodController.getDefaultPaymentMethod)
);

/**
 * POST /api/payments/methods/save-token
 * Guardar token de tarjeta de proveedor (Tilopay hash o Stripe PM)
 */
router.post(
  "/methods/save-token",
  auth,
  createPaymentLimiter,
  asHandler(paymentMethodController.saveProviderToken)
);

/**
 * POST /api/payments/methods/:id/charge
 * One-click checkout con tarjeta guardada
 */
router.post(
  "/methods/:id/charge",
  auth,
  createPaymentLimiter,
  asHandler(paymentMethodController.chargeWithSavedCard)
);

export default router;
