import { logger } from "../utils/logger";

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || "http://localhost:4005";

interface PaymentStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  currency: string;
  completedPayments: number;
  pendingPayments: number;
}

interface PayoutRow {
  id: string;
  artistId: string;
  bookingId?: string | null;
  amount: number;
  currency: string;
  status: string;
  payoutType?: string | null;
  description?: string | null;
  commissionRate?: number | null;
  platformFee?: number | null;
  netAmount?: number | null;
  transferReference?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface PayoutStats {
  totalEarnings: number;
  pendingAmount: number;
  completedAmount: number;
  currency: string;
  totalPayouts: number;
  pendingCount: number;
  completedCount: number;
}

export class PaymentsServiceClient {
  /**
   * Obtener payouts del artista
   */
  async getArtistPayouts(artistId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payouts: PayoutRow[]; total: number; page: number; totalPages: number }> {
    try {
      const qs = new URLSearchParams({ artistId, ...(params?.status && { status: params.status }), page: String(params?.page || 1), limit: String(params?.limit || 20) }).toString();
      const response = await fetch(`${PAYMENTS_SERVICE_URL}/api/payouts/artists/${artistId}?${qs}`);
      if (!response.ok) return { payouts: [], total: 0, page: 1, totalPages: 0 };
      const data = await response.json() as any;
      return { payouts: data.payouts ?? data.data ?? [], total: data.total ?? 0, page: data.page ?? 1, totalPages: data.totalPages ?? 1 };
    } catch (error: any) {
      logger.error("Error in getArtistPayouts", "PAYMENTS_CLIENT", { error: error.message });
      return { payouts: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Obtener estadísticas de payouts del artista
   */
  async getArtistPayoutStats(artistId: string): Promise<PayoutStats> {
    try {
      const response = await fetch(`${PAYMENTS_SERVICE_URL}/api/payouts/artists/${artistId}/stats`);
      if (!response.ok) return { totalEarnings: 0, pendingAmount: 0, completedAmount: 0, currency: "USD", totalPayouts: 0, pendingCount: 0, completedCount: 0 };
      const data = await response.json() as any;
      return (data.data ?? data) as PayoutStats;
    } catch (error: any) {
      logger.error("Error in getArtistPayoutStats", "PAYMENTS_CLIENT", { error: error.message });
      return { totalEarnings: 0, pendingAmount: 0, completedAmount: 0, currency: "USD", totalPayouts: 0, pendingCount: 0, completedCount: 0 };
    }
  }

  /**
   * Obtener estadísticas de pagos del artista
   */
  async getArtistPaymentStats(artistId: string): Promise<PaymentStats> {
    try {
      const response = await fetch(
        `${PAYMENTS_SERVICE_URL}/api/payments/stats?artistId=${artistId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error("Error fetching payment stats", "PAYMENTS_CLIENT", {
          status: response.status,
          statusText: response.statusText,
        });
        return {
          totalRevenue: 0,
          thisMonthRevenue: 0,
          currency: "USD",
          completedPayments: 0,
          pendingPayments: 0,
        };
      }

      const data = await response.json();
      return data as PaymentStats;
    } catch (error: any) {
      logger.error("Error in getArtistPaymentStats", "PAYMENTS_CLIENT", {
        error: error.message,
      });
      return {
        totalRevenue: 0,
        thisMonthRevenue: 0,
        currency: "USD",
        completedPayments: 0,
        pendingPayments: 0,
      };
    }
  }
}

export const paymentsServiceClient = new PaymentsServiceClient();
