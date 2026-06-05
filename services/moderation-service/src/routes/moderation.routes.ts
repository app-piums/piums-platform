import { Router } from "express";
import { ModerationController } from "../controller/moderation.controller";
import { authenticateToken, requireAdmin, requireAdminOrService } from "../middleware/auth.middleware";
import { checkLimiter, adminLimiter } from "../middleware/rateLimiter";

const router = Router();
const ctrl = new ModerationController();

// ── Endpoints internos (servicio a servicio) ──────────────────────────────────

// POST /api/moderation/check — Verificar contenido (llamado por otros microservicios)
router.post(
  "/check",
  checkLimiter,
  authenticateToken,
  requireAdminOrService,
  ctrl.check.bind(ctrl)
);

// POST /api/moderation/test — Probar texto sin guardar log (solo admin)
router.post(
  "/test",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.testCheck.bind(ctrl)
);

// ── Gestión del blacklist (admin) ─────────────────────────────────────────────

// GET  /api/moderation/blacklist
router.get(
  "/blacklist",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.listWords.bind(ctrl)
);

// POST /api/moderation/blacklist
router.post(
  "/blacklist",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.createWord.bind(ctrl)
);

// PUT  /api/moderation/blacklist/:id
router.put(
  "/blacklist/:id",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.updateWord.bind(ctrl)
);

// DELETE /api/moderation/blacklist/:id (desactiva, no borra físicamente)
router.delete(
  "/blacklist/:id",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.deactivateWord.bind(ctrl)
);

// ── Logs de auditoría (admin) ─────────────────────────────────────────────────

// GET /api/moderation/logs
router.get(
  "/logs",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.getLogs.bind(ctrl)
);

// ── Cola de revisión manual (admin) ──────────────────────────────────────────

// GET  /api/moderation/queue
router.get(
  "/queue",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.getQueue.bind(ctrl)
);

// POST /api/moderation/queue/:logId/resolve
router.post(
  "/queue/:logId/resolve",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.resolveQueue.bind(ctrl)
);

// ── Strikes (admin) ───────────────────────────────────────────────────────────

// GET    /api/moderation/strikes/:userId
router.get(
  "/strikes/:userId",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.getStrikes.bind(ctrl)
);

// POST   /api/moderation/strikes/:strikeId/resolve
router.post(
  "/strikes/:strikeId/resolve",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  ctrl.resolveStrikeHandler.bind(ctrl)
);

export default router;
