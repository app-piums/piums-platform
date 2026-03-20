import { Router, RequestHandler } from "express";
import { reviewController } from "../controller/review.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createReviewLimiter,
  responseReviewLimiter,
  reportReviewLimiter,
  markHelpfulLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();
const asHandler = (fn: Function): RequestHandler => fn as unknown as RequestHandler;
const auth = authenticateToken as RequestHandler;

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
  "/reports/pending",
  auth,
  asHandler(reviewController.getPendingReports.bind(reviewController))
);

// ==================== ARTIST RATINGS ====================

// Obtener estadísticas de artista (público)
router.get(
  "/artists/:artistId/rating",
  asHandler(reviewController.getArtistRating.bind(reviewController))
);

// Recalcular estadísticas de artista (admin/internal)
router.post(
  "/artists/:artistId/rating/update",
  auth,
  asHandler(reviewController.updateArtistRating.bind(reviewController))
);

export default router;
