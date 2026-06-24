/**
 * Cliente HTTP para comunicarse con search-service
 */

import { logger } from '../utils/logger';

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:4009';
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

export interface ReplacementCandidate {
  serviceId: string;
  artistId: string;
  artistName: string;
  artistRating: number;
  price: number; // GTQ float (no centavos)
  city: string | null;
}

export interface SonidistaCandidate extends ReplacementCandidate {
  avatar: string | null;
}

class SearchClient {
  async findReplacementServices(params: {
    category: string;
    city: string;
    maxPriceGTQ: number;
    excludeArtistId: string;
    limit?: number;
  }): Promise<ReplacementCandidate[]> {
    try {
      const qs = new URLSearchParams({
        category: params.category,
        city: params.city,
        maxPrice: String(params.maxPriceGTQ),
        isAvailable: 'true',
        sortBy: 'rating',
        limit: String(params.limit ?? 10),
      });

      const response = await fetch(`${SEARCH_SERVICE_URL}/api/search/services?${qs}`, {
        signal: AbortSignal.timeout(8_000),
        headers: { 'x-internal-secret': INTERNAL_SERVICE_SECRET },
      });

      if (!response.ok) {
        logger.warn('search-service devolvió error al buscar reemplazos', 'SEARCH_CLIENT', {
          status: response.status,
        });
        return [];
      }

      const data = await response.json() as any;
      const services: any[] = data?.services ?? data?.data?.services ?? [];

      return services
        .filter((s: any) => s.artistId !== params.excludeArtistId)
        .map((s: any) => ({
          serviceId: s.id,
          artistId: s.artistId,
          artistName: s.artistName ?? '',
          artistRating: s.artistRating ?? 0,
          price: s.price ?? 0,
          city: s.city ?? null,
        }));
    } catch (error: any) {
      logger.error('Error conectando con search-service', 'SEARCH_CLIENT', { error: error.message });
      return [];
    }
  }
  async findSonidistasForBooking(params: {
    city: string;
    limit?: number;
  }): Promise<SonidistaCandidate[]> {
    try {
      const qs = new URLSearchParams({
        city: params.city,
        limit: String(params.limit ?? 10),
      });

      const response = await fetch(`${SEARCH_SERVICE_URL}/api/search/sonidistas?${qs}`, {
        signal: AbortSignal.timeout(8_000),
        headers: { 'x-internal-secret': INTERNAL_SERVICE_SECRET },
      });

      if (!response.ok) {
        logger.warn('search-service devolvió error al buscar sonidistas', 'SEARCH_CLIENT', {
          status: response.status,
        });
        return [];
      }

      const data = await response.json() as any;
      const list: any[] = data?.sonidistas ?? [];

      return list.map((s: any) => ({
        serviceId: s.serviceId,
        artistId: s.artistId,
        artistName: s.artistName ?? '',
        artistRating: s.artistRating ?? 0,
        price: s.price ?? 0,
        city: s.city ?? null,
        avatar: s.avatar ?? null,
      }));
    } catch (error: any) {
      logger.error('Error conectando con search-service (sonidistas)', 'SEARCH_CLIENT', { error: error.message });
      return [];
    }
  }
}

export const searchClient = new SearchClient();
