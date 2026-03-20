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

export default router;
