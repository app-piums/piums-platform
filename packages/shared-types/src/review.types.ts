// ============================================================================
// @piums/shared-types — Review domain types
// ============================================================================

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  artistId: string;
  rating: number;        // 1-5
  title?: string;
  body: string;
  status: ReviewStatus;
  isVerified: boolean;
  isHelpful?: number;
  response?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  id: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  user?: {
    id: string;
    nombre: string;
    avatar?: string;
  };
}

export interface ReviewDetailed extends Review {
  user?: {
    id: string;
    nombre: string;
    avatar?: string;
  };
  artist?: {
    id: string;
    nombre: string;
    slug?: string;
  };
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  artistId: string;
  message: string;
  createdAt: string;
}

export interface ArtistRating {
  artistId: string;
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  title?: string;
  body: string;
}

export interface ReportReviewRequest {
  reason: string;
  description?: string;
}
