import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";
import { paymentService } from "../services/payment.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/credits/my
 * Créditos activos del usuario autenticado
 */
router.get(
  "/credits/my",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) throw new AppError(401, "No autorizado");

      const credits = await paymentService.getActiveCredits(userId);
      const totalAmount = credits.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0);

      res.json({
        success: true,
        data: {
          credits,
          totalAmount,
          currency: "USD",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/credits/internal
 * Crear crédito (solo servicios internos)
 * Body: { userId, bookingId?, paidAmount, reason }
 */
router.post(
  "/credits/internal",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        throw new AppError(403, "Acceso denegado");
      }

      const { userId, bookingId, paidAmount, reason } = req.body;

      if (!userId || paidAmount == null || !reason) {
        throw new AppError(400, "Faltan campos requeridos: userId, paidAmount, reason");
      }
      if (typeof paidAmount !== "number" || paidAmount < 0) {
        throw new AppError(400, "paidAmount debe ser un número positivo");
      }

      const credit = await paymentService.createCredit({ userId, bookingId, paidAmount, reason });

      res.status(201).json({ success: true, data: credit });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/credits/expire (internal cron trigger)
 * Expirar créditos vencidos
 */
router.post(
  "/credits/expire",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        throw new AppError(403, "Acceso denegado");
      }

      const count = await paymentService.expireCredits();
      logger.info(`Cron: expired ${count} credits`, "CREDIT_CRON");

      res.json({ success: true, expired: count });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/credits/admin
 * Listar todos los créditos — solo admin
 * Query: status?, userId?, page?, limit?
 */
router.get(
  "/credits/admin",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (user?.role !== "admin") throw new AppError(403, "Solo administradores");

      const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
      const limit = Math.min(100, parseInt(req.query["limit"] as string) || 25);
      const status = req.query["status"] as string | undefined;
      const userId = req.query["userId"] as string | undefined;

      const where: Record<string, any> = { deletedAt: null };
      if (status) where["status"] = status;
      if (userId) where["userId"] = userId;

      const [credits, total] = await Promise.all([
        (prisma as any).credit.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        (prisma as any).credit.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          credits,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/credits/admin/cancel/:id
 * Cancelar un crédito manualmente — solo admin
 */
router.post(
  "/credits/admin/cancel/:id",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (user?.role !== "admin") throw new AppError(403, "Solo administradores");

      const id = req.params["id"];
      const credit = await (prisma as any).credit.findUnique({ where: { id } });
      if (!credit) throw new AppError(404, "Crédito no encontrado");
      if (credit.status !== "ACTIVE") throw new AppError(400, "Solo se pueden cancelar créditos activos");

      const updated = await (prisma as any).credit.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      logger.info(`Admin cancelled credit ${id}`, "CREDIT_ADMIN", { adminId: user.id });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
