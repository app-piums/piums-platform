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
      const userId = req.user.id;
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
      const id = req.params.id as string;

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
      const id = req.params.id as string;
      const userId = req.user.id;
      const data = updateReviewSchema.parse(req.body);

      const review = await reviewService.updateReview(id, userId, data);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user.id;

      const review = await reviewService.deleteReview(id, userId);
      res.json({ message: "Reseña eliminada", review });
    } catch (error) {
      next(error);
    }
  }

  // ==================== RESPONSES ====================

  async respondToReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.id as string;
      const artistId = req.user.id;
      const { message } = respondReviewSchema.parse(req.body);

      const response = await reviewService.respondToReview(reviewId, artistId, message);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const responseId = req.params.id as string;
      const artistId = req.user.id;
      const { message } = respondReviewSchema.parse(req.body);

      const response = await reviewService.updateResponse(responseId, artistId, message);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const responseId = req.params.id as string;
      const artistId = req.user.id;

      const response = await reviewService.deleteResponse(responseId, artistId);
      res.json({ message: "Respuesta eliminada", response });
    } catch (error) {
      next(error);
    }
  }

  // ==================== HELPFUL VOTES ====================

  async markHelpful(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.id as string;
      const userId = req.user.id;
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
      const reviewId = req.params.id as string;
      const userId = req.user.id;
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
      const estado = req.query.estado as string | undefined;

      const result = await reviewService.getPendingReports(page, limit, estado);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await reviewService.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const resolvedBy = req.user.id;

      const status = action === "dismissed" ? "DISMISSED" : "RESOLVED";

      const report = await reviewService.resolveReport(id, resolvedBy, {
        status,
        resolution: notes,
      });

      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getReportMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const messages = await reviewService.getReportMessages(id);
      res.json({ messages });
    } catch (error) {
      next(error);
    }
  }

  async addReportMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const senderId = req.user.id;
      const msg = await reviewService.addReportMessage(id, senderId, "staff", message);
      res.status(201).json(msg);
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const stats = await reviewService.getUserStats(userId as string);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getBatchRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistIds } = req.body;
      const ratings = await reviewService.getBatchRatings(artistIds);
      res.json(ratings);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ARTIST RATINGS ====================

  async getArtistRating(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;

      const rating = await reviewService.getArtistRating(artistId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }

  async updateArtistRating(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;

      await reviewService.updateArtistRating(artistId);
      const rating = await reviewService.getArtistRating(artistId);
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
