import { logger } from "../utils/logger";

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || "http://localhost:4005";

interface PaymentStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  currency: string;
  completedPayments: number;
  pendingPayments: number;
}

export class PaymentsServiceClient {
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
          currency: "GTQ",
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
        currency: "GTQ",
        completedPayments: 0,
        pendingPayments: 0,
      };
    }
  }
}

export const paymentsServiceClient = new PaymentsServiceClient();
