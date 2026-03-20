/**
 * Cliente HTTP para comunicarse con catalog-service
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4004';

interface PriceCalculationInput {
  serviceId: string;
  durationMinutes?: number;
  selectedAddonIds?: string[];
  distanceKm?: number;
}

interface PriceItem {
  type: 'BASE' | 'ADDON' | 'TRAVEL' | 'DISCOUNT';
  name: string;
  qty: number;
  unitPriceCents: number;
  totalPriceCents: number;
  metadata?: any;
}

interface PriceQuote {
  serviceId: string;
  currency: string;
  items: PriceItem[];
  subtotalCents: number;
  totalCents: number;
  depositRequiredCents?: number;
  breakdown: {
    baseCents: number;
    addonsCents: number;
    travelCents: number;
    discountsCents: number;
  };
}

export class CatalogClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CATALOG_SERVICE_URL;
  }

  /**
   * Calcular precio completo de un servicio
   */
  async calculatePrice(input: PriceCalculationInput): Promise<PriceQuote | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/pricing/calculate`,
        input,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 segundos
        }
      );

      if (response.status === 200 && response.data) {
        return response.data as PriceQuote;
      }

      logger.warn('Unexpected response from catalog-service', 'CATALOG_CLIENT', {
        status: response.status,
        data: response.data,
      });
      return null;
    } catch (error: any) {
      logger.error('Error calling catalog-service pricing API', 'CATALOG_CLIENT', {
        error: error.message,
        serviceId: input.serviceId,
        url: `${this.baseUrl}/api/pricing/calculate`,
      });
      return null;
    }
  }

  /**
   * Obtener información de un servicio
   */
  async getService(serviceId: string): Promise<any | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/catalog/services/${serviceId}`,
        {
          timeout: 5000,
        }
      );

      if (response.status === 200 && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      logger.error('Error fetching service from catalog-service', 'CATALOG_CLIENT', {
        error: error.message,
        serviceId,
      });
      return null;
    }
  }

  /**
   * Validar que un servicio existe y está disponible
   */
  async validateService(serviceId: string): Promise<boolean> {
    try {
      const service = await this.getService(serviceId);
      return service && service.isAvailable && service.status === 'ACTIVE';
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const catalogClient = new CatalogClient();
