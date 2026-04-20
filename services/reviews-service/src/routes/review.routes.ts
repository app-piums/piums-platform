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

router.post(
  "/reviews",
  auth,
  createReviewLimiter,
  asHandler(reviewController.createReview.bind(reviewController))
);

router.get(
  "/reviews/:id",
  asHandler(reviewController.getReviewById.bind(reviewController))
);

router.get(
  "/reviews",
  asHandler(reviewController.getReviews.bind(reviewController))
);

router.patch(
  "/reviews/:id",
  auth,
  asHandler(reviewController.updateReview.bind(reviewController))
);

router.delete(
  "/reviews/:id",
  auth,
  adminOnly,
  asHandler(reviewController.deleteReview.bind(reviewController))
);

// ==================== RESPONSES ====================

router.post(
  "/reviews/:id/respond",
  auth,
  responseReviewLimiter,
  asHandler(reviewController.respondToReview.bind(reviewController))
);

router.patch(
  "/reviews/responses/:id",
  auth,
  asHandler(reviewController.updateResponse.bind(reviewController))
);

router.delete(
  "/reviews/responses/:id",
  auth,
  asHandler(reviewController.deleteResponse.bind(reviewController))
);

// ==================== HELPFUL VOTES ====================

router.post(
  "/reviews/:id/helpful",
  auth,
  markHelpfulLimiter,
  asHandler(reviewController.markHelpful.bind(reviewController))
);

// ==================== REPORTS ====================

router.post(
  "/reviews/:id/report",
  auth,
  reportReviewLimiter,
  asHandler(reviewController.reportReview.bind(reviewController))
);

// Specific paths before parameterized ones
router.get(
  "/reviews/admin/reports/pending",
  auth,
  adminOnly,
  asHandler(reviewController.getPendingReports.bind(reviewController))
);

router.get(
  "/reviews/admin/stats",
  auth,
  adminOnly,
  asHandler(reviewController.getAdminStats.bind(reviewController))
);

router.post(
  "/reviews/admin/batch-ratings",
  auth,
  adminOnly,
  asHandler(reviewController.getBatchRatings.bind(reviewController))
);

router.patch(
  "/reviews/admin/reports/:id/resolve",
  auth,
  adminOnly,
  asHandler(reviewController.resolveReport.bind(reviewController))
);

router.get(
  "/reviews/admin/reports/:id/messages",
  auth,
  adminOnly,
  asHandler(reviewController.getReportMessages.bind(reviewController))
);

router.post(
  "/reviews/admin/reports/:id/messages",
  auth,
  adminOnly,
  asHandler(reviewController.addReportMessage.bind(reviewController))
);

// ==================== ARTIST RATINGS ====================

router.get(
  "/reviews/artists/:artistId/rating",
  asHandler(reviewController.getArtistRating.bind(reviewController))
);

router.get(
  "/reviews/users/:userId/stats",
  auth,
  asHandler(reviewController.getUserStats.bind(reviewController))
);

router.post(
  "/reviews/artists/:artistId/rating/update",
  auth,
  adminOnly,
  asHandler(reviewController.updateArtistRating.bind(reviewController))
);

export default router;
