import axios from 'axios';
import { logger } from '../utils/logger';

const REVIEWS_SERVICE_URL = process.env.REVIEWS_SERVICE_URL || 'http://localhost:4006';

export interface ReportStats {
  pendingCount: number;
}

export class ReviewsClient {
  /**
   * Obtiene reportes pendientes para el admin
   */
  async getPendingReports(token?: string, page: number = 1, limit: number = 20, estado?: string) {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = token;
      
      const params: any = { page, limit };
      if (estado) params.estado = estado;

      const response = await axios.get(`${REVIEWS_SERVICE_URL}/api/reviews/admin/reports/pending`, {
        params,
        headers,
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching pending reports', 'REVIEWS_CLIENT', error.message);
      return { reports: [], total: 0, page, totalPages: 0 };
    }
  }

  /**
   * Obtiene estadísticas de reportes
   */
  async getStats(token?: string): Promise<ReportStats> {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = token;

      const response = await axios.get(`${REVIEWS_SERVICE_URL}/api/reviews/admin/stats`, {
        headers,
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching report stats', 'REVIEWS_CLIENT', error.message);
      return { pendingCount: 0 };
    }
  }

  /**
   * Obtiene estadísticas de reseñas de un usuario específico
   */
  async getUserStats(userId: string) {
    try {
      const response = await axios.get(`${REVIEWS_SERVICE_URL}/api/reviews/users/${userId}/stats`, {
        timeout: 2000,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching user review stats', 'REVIEWS_CLIENT', error.message);
      return { totalReviews: 0, totalReports: 0 };
    }
  }

  /**
   * Obtiene el rating de una lista de artistas
   */
  async getBatchStats(artistIds: string[], token?: string) {
    try {
      if (artistIds.length === 0) return {};
      const headers: any = {};
      if (token) headers['Authorization'] = token;

      const response = await axios.post(`${REVIEWS_SERVICE_URL}/api/reviews/admin/batch-ratings`, {
        artistIds,
      }, { 
        headers,
        timeout: 3000 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching batch review stats', 'REVIEWS_CLIENT', error.message);
      return {};
    }
  }

  /**
   * Resuelve un reporte
   */
  async resolveReport(id: string, action: string, notes?: string, token?: string) {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = token;

      const response = await axios.patch(`${REVIEWS_SERVICE_URL}/api/reviews/admin/reports/${id}/resolve`, {
        action,
        notes,
      }, { 
        headers,
        timeout: 5000 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error resolving report', 'REVIEWS_CLIENT', error.message);
      throw error;
    }
  }
}

export const reviewsClient = new ReviewsClient();
