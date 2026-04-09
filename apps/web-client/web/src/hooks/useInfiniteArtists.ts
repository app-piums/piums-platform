import { useInfiniteQuery } from '@tanstack/react-query';
import type { Artist, GetArtistsParams, SmartSearchParams } from '@piums/sdk';
import { MOCK_ARTISTS } from '@/lib/mockData';

export interface ArtistsFilters {
  q?: string;
  category?: string;
  cityId?: string;
  guests?: number;
}

interface ArtistsPageResponse {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

const ITEMS_PER_PAGE = 12;

// ─── Accent normalization + category alias resolution ─────────────────────────

/** Strip diacritics so "música" → "musica", "Ángel" → "Angel" */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes the free-text query (strip accents, lowercase).
 * Free-text always goes through smartSearch — no category alias conversion.
 * The category dropdown still works as an explicit filter.
 */
function resolveFilters(filters: ArtistsFilters): ArtistsFilters {
  if (!filters.q) return filters;
  const norm = stripAccents(filters.q).toLowerCase().trim();
  return { ...filters, q: norm };
}

// ─── Mock data path ───────────────────────────────────────────────────────────

const getMockPage = (page: number, filters: ArtistsFilters): ArtistsPageResponse => {
  const resolved = resolveFilters(filters);
  let filtered = MOCK_ARTISTS as Artist[];
  if (resolved.category) filtered = filtered.filter(a => a.category?.toLowerCase() === resolved.category!.toLowerCase());
  if (resolved.cityId) filtered = filtered.filter(a => a.cityId === resolved.cityId);
  if (resolved.q) {
    const q = resolved.q;
    filtered = filtered.filter(a =>
      stripAccents(a.nombre).toLowerCase().includes(q) ||
      (a.category && stripAccents(a.category).toLowerCase().includes(q))
    );
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  return {
    artists: filtered.slice(start, start + ITEMS_PER_PAGE),
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
  };
};

// ─── Real API path ────────────────────────────────────────────────────────────

type ArtistsQueryParams = GetArtistsParams;

const fetchArtistsPage = async (
  page: number,
  filters: ArtistsFilters
): Promise<ArtistsPageResponse> => {
  try {
    const { sdk } = await import('@piums/sdk');
    const resolved = resolveFilters(filters);

    // When a free-text query is present (and no explicit category override),
    // use the smart semantic search endpoint for synonym expansion + scoring.
    if (resolved.q && !resolved.category) {
      const params: SmartSearchParams = {
        q: resolved.q,
        page,
        limit: ITEMS_PER_PAGE,
        ...(resolved.cityId && { city: resolved.cityId }),
        ...(filters.guests != null && { minGuests: filters.guests }),
      };
      const result = await sdk.smartSearch(params);
      return {
        artists: result.artists,
        total: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.page < result.pagination.totalPages,
      };
    }

    const params: ArtistsQueryParams = { page, limit: ITEMS_PER_PAGE };
    if (resolved.category) params.category = resolved.category;
    if (resolved.cityId) params.city = resolved.cityId;
    if (resolved.q) params.q = resolved.q;
    const result = await sdk.getArtists(params);
    return {
      artists: result.artists,
      total: result.total || result.artists.length,
      page: result.page || page,
      totalPages: result.totalPages,
      hasNextPage: page < result.totalPages,
    };
  } catch {
    return getMockPage(page, filters);
  }
};

export function useInfiniteArtists(filters: ArtistsFilters) {
  return useInfiniteQuery({
    queryKey: ['artists', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtistsPage(pageParam, filters),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}

