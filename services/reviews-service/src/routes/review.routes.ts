import { Router, RequestHandler } from "express";
import { reviewController } from "../controller/review.controller";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware";
import {
  createReviewLimiter,
  responseReviewLimiter,
  reportReviewLimiter,
  markHelpfulLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();
const asHandler = (fn: Function): RequestHandler => fn as unknown as RequestHandler;
const auth = authenticateToken as RequestHandler;
const adminOnly = requireAdmin as RequestHandler;

// ==================== REVIEWS ====================

// Crear reseña (requiere autenticación)
router.post(
  "/reviews",
  auth,
  createReviewLimiter,
  asHandler(reviewController.createReview.bind(reviewController))
);

// Obtener reseña por ID (público)
router.get(
  "/reviews/:id",
  asHandler(reviewController.getReviewById.bind(reviewController))
);

// Listar reseñas con filtros (público)
router.get(
  "/reviews",
  asHandler(reviewController.getReviews.bind(reviewController))
);

// Actualizar reseña (requiere autenticación)
router.patch(
  "/reviews/:id",
  auth,
  asHandler(reviewController.updateReview.bind(reviewController))
);

// Eliminar reseña (requiere autenticación)
router.delete(
  "/reviews/:id",
  auth,
  asHandler(reviewController.deleteReview.bind(reviewController))
);

// ==================== RESPONSES ====================

// Responder a reseña (artistas)
router.post(
  "/reviews/:id/respond",
  auth,
  responseReviewLimiter,
  asHandler(reviewController.respondToReview.bind(reviewController))
);

// Actualizar respuesta
router.patch(
  "/responses/:id",
  auth,
  asHandler(reviewController.updateResponse.bind(reviewController))
);

// Eliminar respuesta
router.delete(
  "/responses/:id",
  auth,
  asHandler(reviewController.deleteResponse.bind(reviewController))
);

// ==================== HELPFUL VOTES ====================

// Marcar reseña como útil/no útil
router.post(
  "/reviews/:id/helpful",
  auth,
  markHelpfulLimiter,
  asHandler(reviewController.markHelpful.bind(reviewController))
);

// ==================== REPORTS ====================

// Reportar reseña
router.post(
  "/reviews/:id/report",
  auth,
  reportReviewLimiter,
  asHandler(reviewController.reportReview.bind(reviewController))
);

// Obtener reportes pendientes (admin)
router.get(
  "/admin/reports/pending",
  auth,
  adminOnly,
  asHandler(reviewController.getPendingReports.bind(reviewController))
);

// Resolver reporte (admin)
router.patch(
  "/admin/reports/:id/resolve",
  auth,
  adminOnly,
  asHandler(reviewController.resolveReport.bind(reviewController))
);

// Mensajes de seguimiento de un reporte (admin)
router.get(
  "/admin/reports/:id/messages",
  auth,
  adminOnly,
  asHandler(reviewController.getReportMessages.bind(reviewController))
);

router.post(
  "/admin/reports/:id/messages",
  auth,
  adminOnly,
  asHandler(reviewController.addReportMessage.bind(reviewController))
);

// Obtener estadísticas de reportes para el dashboard (admin)
router.get(
  "/admin/stats",
  auth,
  adminOnly,
  asHandler(reviewController.getAdminStats.bind(reviewController))
);

router.post(
  "/admin/batch-ratings",
  auth,
  adminOnly,
  asHandler(reviewController.getBatchRatings.bind(reviewController))
);

// ==================== ARTIST RATINGS ====================

// Obtener estadísticas de artista (público)
router.get(
  "/artists/:artistId/rating",
  asHandler(reviewController.getArtistRating.bind(reviewController))
);

// Obtener estadísticas de un usuario específico (requiere autenticación)
router.get(
  "/users/:userId/stats",
  auth,
  asHandler(reviewController.getUserStats.bind(reviewController))
);

// Recalcular estadísticas de artista (admin/internal)
router.post(
  "/artists/:artistId/rating/update",
  auth,
  adminOnly,
  asHandler(reviewController.updateArtistRating.bind(reviewController))
);

export default router;
