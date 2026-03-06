import { Router } from "express";
import { paymentMethodController } from "../controller/paymentMethod.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { createPaymentLimiter } from "../middleware/rateLimiter";

const router = Router();

// ==================== PAYMENT METHODS ====================

/**
 * GET /api/payments/methods
 * Obtener métodos de pago del usuario
 */
router.get(
  "/methods",
  authenticateToken,
  paymentMethodController.getPaymentMethods
);

/**
 * POST /api/payments/methods
 * Agregar nuevo método de pago
 */
router.post(
  "/methods",
  authenticateToken,
  createPaymentLimiter,
  paymentMethodController.addPaymentMethod
);

/**
 * DELETE /api/payments/methods/:id
 * Eliminar método de pago
 */
router.delete(
  "/methods/:id",
  authenticateToken,
  paymentMethodController.deletePaymentMethod
);

/**
 * PATCH /api/payments/methods/:id/default
 * Establecer método como predeterminado
 */
router.patch(
  "/methods/:id/default",
  authenticateToken,
  paymentMethodController.setDefaultPaymentMethod
);

export default router;
