import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { payoutController } from "../controller/payout.controller";
import { payoutService } from "../services/payout.service";
import { authenticateToken, requireActiveSession } from "../middleware/auth.middleware";

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
  requireActiveSession,
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
 * POST /api/payouts/internal
 * Crear payout desde otro servicio (x-internal-secret) — sin JWT
 * DEBE ir ANTES de /payouts/:id
 */
router.post(
  "/payouts/internal",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }

      const { artistId, bookingId, paymentId, amount, currency, payoutType, description, metadata } = req.body;

      if (!artistId || !amount || amount <= 0) {
        res.status(400).json({ message: "artistId y amount son requeridos" });
        return;
      }

      // Idempotencia: no crear payout duplicado para el mismo bookingId + payoutType
      if (bookingId && payoutType) {
        const existing = await (prisma as any).payout.findFirst({
          where: { bookingId, payoutType, deletedAt: null, status: { not: "CANCELLED" } },
        });
        if (existing) {
          res.json({ success: true, data: existing, duplicate: true });
          return;
        }
      }

      const payout = await payoutService.createPayout({
        artistId, bookingId, paymentId, amount, currency, payoutType, description, metadata,
      });

      res.status(201).json({ success: true, data: payout });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/payouts/internal/schedule
 * Establecer/limpiar scheduledFor (hold) en un payout por bookingId (x-internal-secret)
 * Body: { bookingId: string, scheduledFor: string | null }
 */
router.patch(
  "/payouts/internal/schedule",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }

      const { bookingId, scheduledFor } = req.body;
      if (!bookingId) {
        res.status(400).json({ message: "bookingId es requerido" });
        return;
      }

      const date = scheduledFor ? new Date(scheduledFor) : null;
      const payout = await payoutService.schedulePayoutHold(bookingId, date);

      res.json({ success: true, data: payout });
    } catch (err) {
      next(err);
    }
  }
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
      const id = req.params['id'] as string;
      const body = req.body as { transferReference?: string };
      const transferReference = String(body.transferReference ?? '');
      // Derive completedByAdmin from header set by auth-service (not from request body)
      const completedByAdmin = req.headers['x-admin-id'] as string | undefined;

      if (!transferReference?.trim()) {
        res.status(400).json({ message: "transferReference es requerido" });
        return;
      }

      const payout = await payoutService.completePayout(id, transferReference, completedByAdmin as string | undefined);
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
