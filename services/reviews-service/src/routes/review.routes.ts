import { Router, RequestHandler } from "express";
import { reviewController } from "../controller/review.controller";
import { authenticateToken, requireAdmin, requireActiveSession, optionalAuth } from "../middleware/auth.middleware";
import {
  createReviewLimiter,
  responseReviewLimiter,
  reportReviewLimiter,
  markHelpfulLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();
const asHandler = (fn: Function): RequestHandler => fn as unknown as RequestHandler;
const auth = authenticateToken as RequestHandler;
const optAuth = optionalAuth as RequestHandler;
const sessionActive = requireActiveSession as unknown as RequestHandler;
const adminOnly = requireAdmin as RequestHandler;

// ==================== REVIEWS ====================

router.post(
  "/reviews",
  auth,
  sessionActive,
  createReviewLimiter,
  asHandler(reviewController.createReview.bind(reviewController))
);

router.get(
  "/reviews/:id",
  asHandler(reviewController.getReviewById.bind(reviewController))
);

router.get(
  "/reviews",
  optAuth,
  asHandler(reviewController.getReviews.bind(reviewController))
);

router.patch(
  "/reviews/:id",
  auth,
  sessionActive,
  asHandler(reviewController.updateReview.bind(reviewController))
);

router.delete(
  "/reviews/:id",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.deleteReview.bind(reviewController))
);

// ==================== RESPONSES ====================

router.post(
  "/reviews/:id/respond",
  auth,
  sessionActive,
  responseReviewLimiter,
  asHandler(reviewController.respondToReview.bind(reviewController))
);

router.patch(
  "/reviews/responses/:id",
  auth,
  sessionActive,
  asHandler(reviewController.updateResponse.bind(reviewController))
);

router.delete(
  "/reviews/responses/:id",
  auth,
  sessionActive,
  asHandler(reviewController.deleteResponse.bind(reviewController))
);

// ==================== HELPFUL VOTES ====================

router.post(
  "/reviews/:id/helpful",
  auth,
  sessionActive,
  markHelpfulLimiter,
  asHandler(reviewController.markHelpful.bind(reviewController))
);

// ==================== REPORTS ====================

router.post(
  "/reviews/:id/report",
  auth,
  sessionActive,
  reportReviewLimiter,
  asHandler(reviewController.reportReview.bind(reviewController))
);

// Specific paths before parameterized ones
router.get(
  "/reviews/admin/reports/pending",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.getPendingReports.bind(reviewController))
);

router.get(
  "/reviews/admin/stats",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.getAdminStats.bind(reviewController))
);

router.post(
  "/reviews/admin/batch-ratings",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.getBatchRatings.bind(reviewController))
);

router.patch(
  "/reviews/admin/reports/:id/resolve",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.resolveReport.bind(reviewController))
);

router.get(
  "/reviews/admin/reports/:id/messages",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.getReportMessages.bind(reviewController))
);

router.post(
  "/reviews/admin/reports/:id/messages",
  auth,
  sessionActive,
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
  sessionActive,
  asHandler(reviewController.getUserStats.bind(reviewController))
);

router.post(
  "/reviews/artists/:artistId/rating/update",
  auth,
  sessionActive,
  adminOnly,
  asHandler(reviewController.updateArtistRating.bind(reviewController))
);

export default router;
