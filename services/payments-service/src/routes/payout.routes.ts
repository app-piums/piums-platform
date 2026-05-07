import { Router, Request, Response, NextFunction } from "express";
import { payoutController } from "../controller/payout.controller";
import { payoutService } from "../services/payout.service";
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
 * GET /api/payouts/pending
 * Listar payouts pendientes — solo admin (x-internal-secret)
 * DEBE ir ANTES de /payouts/:id para evitar que Express lo capture como id="pending"
 */
router.get(
  "/payouts/pending",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "50"), 10);
      const result = await payoutService.getPendingPayouts(page, limit);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
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
 * PATCH /api/payouts/:id/complete-manual
 * Marcar un payout como completado manualmente por admin (x-internal-secret)
 * Body: { transferReference, completedByAdmin }
 */
router.patch(
  "/payouts/:id/complete-manual",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }
      const { id } = req.params;
      const { transferReference, completedByAdmin } = req.body as {
        transferReference: string;
        completedByAdmin?: string;
      };

      if (!transferReference?.trim()) {
        res.status(400).json({ message: "transferReference es requerido" });
        return;
      }

      const payout = await payoutService.completePayout(id, transferReference, completedByAdmin);
      res.json({ success: true, data: payout });
    } catch (err) {
      next(err);
    }
  }
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
