import { AppError } from '../middleware/errorHandler';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4004';

export interface ServiceData {
  id: string;
  artistId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  pricingType: string;
  duration?: number;
  capacity?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country: string;
  };
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export const catalogClient = {
  async getService(serviceId: string): Promise<ServiceData | null> {
    try {
      const response = await fetch(`${CATALOG_SERVICE_URL}/api/services/${serviceId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Catalog service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new AppError(`Error fetching service: ${error.message}`, 500);
    }
  },

  async getAllServices(page: number = 1, limit: number = 100): Promise<{ services: ServiceData[], pagination: any }> {
    try {
      const response = await fetch(`${CATALOG_SERVICE_URL}/api/services?page=${page}&limit=${limit}&includeInactive=false`);

      if (!response.ok) {
        throw new Error(`Catalog service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new AppError(`Error fetching services: ${error.message}`, 500);
    }
  },

  async getServicesByArtist(artistId: string): Promise<ServiceData[]> {
    try {
      const response = await fetch(`${CATALOG_SERVICE_URL}/api/services?artistId=${artistId}&includeInactive=false`);

      if (!response.ok) {
        throw new Error(`Catalog service error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.services || [];
    } catch (error: any) {
      throw new AppError(`Error fetching artist services: ${error.message}`, 500);
    }
  }
};
