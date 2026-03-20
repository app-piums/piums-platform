import { AppError } from '../middleware/errorHandler';

const REVIEWS_SERVICE_URL = process.env.REVIEWS_SERVICE_URL || 'http://localhost:4008';

export interface ArtistRating {
  artistId: string;
  averageRating: number;
  totalReviews: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
  responseRate: number;
}

export const reviewsClient = {
  async getArtistRating(artistId: string): Promise<ArtistRating | null> {
    try {
      const response = await fetch(`${REVIEWS_SERVICE_URL}/api/reviews/artists/${artistId}/rating`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Reviews service error: ${response.statusText}`);
      }

      return (await response.json()) as ArtistRating;
    } catch (error: any) {
      // If reviews service is down or artist has no reviews, return null
      return null;
    }
  }
};
