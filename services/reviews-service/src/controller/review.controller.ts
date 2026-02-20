import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { reviewService } from "../services/review.service";
import {
  createReviewSchema,
  updateReviewSchema,
  respondReviewSchema,
  reportReviewSchema,
  filterReviewsSchema,
  markHelpfulSchema,
} from "../schemas/review.schema";

export class ReviewController {
  // ==================== REVIEWS ====================

  async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const data = createReviewSchema.parse(req.body);

      const review = await reviewService.createReview({
        ...data,
        clientId: userId,
      });

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const review = await reviewService.getReviewById(id);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = filterReviewsSchema.parse(req.query);

      const result = await reviewService.getReviews(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const data = updateReviewSchema.parse(req.body);

      const review = await reviewService.updateReview(id, userId, data);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await reviewService.deleteReview(id, userId);
      res.json({ message: "Reseña eliminada", review });
    } catch (error) {
      next(error);
    }
  }

  // ==================== RESPONSES ====================

  async respondToReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: reviewId } = req.params;
      const artistId = req.user.userId;
      const { message } = respondReviewSchema.parse(req.body);

      const response = await reviewService.respondToReview(reviewId, artistId, message);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: responseId } = req.params;
      const artistId = req.user.userId;
      const { message } = respondReviewSchema.parse(req.body);

      const response = await reviewService.updateResponse(responseId, artistId, message);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: responseId } = req.params;
      const artistId = req.user.userId;

      const response = await reviewService.deleteResponse(responseId, artistId);
      res.json({ message: "Respuesta eliminada", response });
    } catch (error) {
      next(error);
    }
  }

  // ==================== HELPFUL VOTES ====================

  async markHelpful(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: reviewId } = req.params;
      const userId = req.user.userId;
      const { isHelpful } = markHelpfulSchema.parse(req.body);

      const review = await reviewService.markHelpful(reviewId, userId, isHelpful);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // ==================== REPORTS ====================

  async reportReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: reviewId } = req.params;
      const userId = req.user.userId;
      const { reason, description } = reportReviewSchema.parse(req.body);

      const report = await reviewService.reportReview(reviewId, userId, reason, description);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  async getPendingReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // TODO: Verificar que el usuario es admin
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await reviewService.getPendingReports(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ARTIST RATINGS ====================

  async getArtistRating(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;

      const rating = await reviewService.getArtistRating(artistId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }

  async updateArtistRating(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;

      await reviewService.updateArtistRating(artistId);
      const rating = await reviewService.getArtistRating(artistId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
