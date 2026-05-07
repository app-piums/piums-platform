import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { authenticateToken } from "../middleware/auth.middleware";

const prisma = new PrismaClient();
const router: Router = Router();

/**
 * POST /api/commission-rules/internal
 * Crear CommissionRule (RATE_OVERRIDE o FIXED_PENALTY) — solo servicios internos
 */
router.post(
  "/commission-rules/internal",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = req.headers["x-internal-secret"];
      if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
        throw new AppError(403, "Acceso denegado");
      }

      const { artistId, type, rate, fixedAmount, currency, reason, startDate, endDate, createdByAdminId } = req.body;

      if (!artistId || !type || !reason || !startDate || !createdByAdminId) {
        throw new AppError(400, "Faltan campos requeridos");
      }
      if (!["RATE_OVERRIDE", "FIXED_PENALTY"].includes(type)) {
        throw new AppError(400, "type debe ser RATE_OVERRIDE o FIXED_PENALTY");
      }

      const rule = await (prisma as any).commissionRule.create({
        data: {
          artistId,
          type,
          rate: rate ?? null,
          fixedAmount: fixedAmount ?? null,
          currency: currency ?? "USD",
          reason,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          isActive: true,
          createdByAdminId,
        },
      });

      logger.info(`CommissionRule created: ${rule.id}`, "COMMISSION", { artistId, type });

      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/commission-rules
 * Listar reglas de comisión (solo admin)
 */
router.get(
  "/commission-rules",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (user?.role !== "admin") throw new AppError(403, "Solo administradores");

      const { artistId, type, isActive } = req.query;
      const where: any = { deletedAt: null };
      if (artistId) where.artistId = artistId as string;
      if (type) where.type = type as string;
      if (isActive !== undefined) where.isActive = isActive === "true";

      const rules = await (prisma as any).commissionRule.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: rules });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
