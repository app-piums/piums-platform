import { Router } from "express";
import { payoutController } from "../controller/payout.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router: Router = Router();

// ==================== PAYOUTS ====================

/**
 * POST /api/payouts
 * Crear un nuevo payout
 * Body: { artistId, bookingId?, paymentId?, amount, currency?, payoutType?, description?, scheduledFor?, metadata? }
 */
router.post(
  "/payouts",
  authenticateToken,
  payoutController.createPayout.bind(payoutController)
);

/**
 * GET /api/payouts
 * Listar payouts con filtros
 * Query: artistId?, bookingId?, status?, payoutType?, fromDate?, toDate?, page?, limit?
 */
router.get(
  "/payouts",
  authenticateToken,
  payoutController.listPayouts.bind(payoutController)
);

/**
 * GET /api/payouts/:id
 * Obtener payout por ID
 */
router.get(
  "/payouts/:id",
  authenticateToken,
  payoutController.getPayoutById.bind(payoutController)
);

/**
 * POST /api/payouts/:id/process
 * Procesar un payout (ejecutar la transferencia a Stripe Connect)
 */
router.post(
  "/payouts/:id/process",
  authenticateToken,
  payoutController.processPayout.bind(payoutController)
);

/**
 * POST /api/payouts/:id/cancel
 * Cancelar un payout pendiente
 * Body: { reason? }
 */
router.post(
  "/payouts/:id/cancel",
  authenticateToken,
  payoutController.cancelPayout.bind(payoutController)
);

/**
 * POST /api/payouts/:id/sync
 * Sincronizar estado con Stripe
 */
router.post(
  "/payouts/:id/sync",
  authenticateToken,
  payoutController.syncPayoutStatus.bind(payoutController)
);

/**
 * GET /api/payouts/artists/:artistId
 * Obtener payouts de un artista específico
 */
router.get(
  "/payouts/artists/:artistId",
  authenticateToken,
  payoutController.getArtistPayouts.bind(payoutController)
);

/**
 * GET /api/payouts/artists/:artistId/stats
 * Obtener estadísticas de payouts de un artista
 */
router.get(
  "/payouts/artists/:artistId/stats",
  authenticateToken,
  payoutController.getArtistPayoutStats.bind(payoutController)
);

/**
 * POST /api/payouts/calculate
 * Calcular monto de payout con fees
 * Body: { originalAmount, payoutType? }
 */
router.post(
  "/payouts/calculate",
  authenticateToken,
  payoutController.calculatePayout.bind(payoutController)
);

export default router;
