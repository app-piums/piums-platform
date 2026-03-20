import { Router } from "express";
import { disputeController } from "../controller/dispute.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router: Router = Router();

// ==================== DISPUTES ====================

/**
 * POST /api/disputes
 * Crear una nueva disputa
 */
router.post(
  "/disputes",
  authenticateToken,
  disputeController.createDispute.bind(disputeController)
);

/**
 * GET /api/disputes
 * Listar disputas (filtradas según permisos del usuario)
 */
router.get(
  "/disputes",
  authenticateToken,
  disputeController.listDisputes.bind(disputeController)
);

/**
 * GET /api/disputes/stats
 * Obtener estadísticas de disputas (solo staff)
 */
router.get(
  "/disputes/stats",
  authenticateToken,
  disputeController.getDisputeStats.bind(disputeController)
);

/**
 * GET /api/disputes/me
 * Obtener disputas del usuario actual
 */
router.get(
  "/disputes/me",
  authenticateToken,
  disputeController.getUserDisputes.bind(disputeController)
);

/**
 * GET /api/disputes/:id
 * Obtener disputa por ID
 */
router.get(
  "/disputes/:id",
  authenticateToken,
  disputeController.getDisputeById.bind(disputeController)
);

/**
 * POST /api/disputes/:id/status
 * Actualizar estado de disputa (solo staff)
 */
router.post(
  "/disputes/:id/status",
  authenticateToken,
  disputeController.updateDisputeStatus.bind(disputeController)
);

/**
 * POST /api/disputes/:id/resolve
 * Resolver disputa (solo staff)
 */
router.post(
  "/disputes/:id/resolve",
  authenticateToken,
  disputeController.resolveDispute.bind(disputeController)
);

/**
 * POST /api/disputes/:id/messages
 * Agregar mensaje a disputa
 */
router.post(
  "/disputes/:id/messages",
  authenticateToken,
  disputeController.addMessage.bind(disputeController)
);

/**
 * POST /api/disputes/:id/escalate
 * Escalar disputa (solo staff)
 */
router.post(
  "/disputes/:id/escalate",
  authenticateToken,
  disputeController.escalateDispute.bind(disputeController)
);

/**
 * POST /api/disputes/:id/close
 * Cerrar disputa (solo staff)
 */
router.post(
  "/disputes/:id/close",
  authenticateToken,
  disputeController.closeDispute.bind(disputeController)
);

export default router;
