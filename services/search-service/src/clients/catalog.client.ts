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
  isMainService?: boolean;
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

      const raw = await response.json() as any;
      return {
        ...raw,
        title: raw.title ?? raw.name,
        price: raw.price ?? (raw.basePrice != null ? raw.basePrice / 100 : undefined),
        isMainService: raw.isMainService ?? false,
        capacity: raw.maxGuests ?? raw.capacity,
      } as ServiceData;
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

      const data = await response.json() as any;
      const raw: any[] = data.services || [];
      return {
        services: raw.map((s: any) => ({
          ...s,
          title: s.title ?? s.name,
          price: s.price ?? (s.basePrice != null ? s.basePrice / 100 : undefined),
          isMainService: s.isMainService ?? false,
          capacity: s.maxGuests ?? s.capacity,
        })) as ServiceData[],
        pagination: data.pagination,
      };
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

      const data = await response.json() as any;
      const raw: any[] = data.services || [];
      // Map catalog field names (name/basePrice) to ServiceData shape (title/price)
      return raw.map((s: any) => ({
        ...s,
        title: s.title ?? s.name,
        price: s.price ?? (s.basePrice != null ? s.basePrice / 100 : undefined),
        isMainService: s.isMainService ?? false,
        capacity: s.maxGuests ?? s.capacity,
      })) as ServiceData[];
    } catch (error: any) {
      throw new AppError(`Error fetching artist services: ${error.message}`, 500);
    }
  }
};
