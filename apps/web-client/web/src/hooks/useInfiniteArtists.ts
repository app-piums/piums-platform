import { useInfiniteQuery } from '@tanstack/react-query';
import type { Artist } from '@piums/sdk';
import { MOCK_ARTISTS } from '@/lib/mockData';

export interface ArtistsFilters {
  q?: string;
  category?: string;
  cityId?: string;
}

interface ArtistsPageResponse {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

const ITEMS_PER_PAGE = 12;

const getMockPage = (page: number, filters: ArtistsFilters): ArtistsPageResponse => {
  let filtered = MOCK_ARTISTS as Artist[];
  if (filters.category) filtered = filtered.filter(a => a.category?.toLowerCase() === filters.category!.toLowerCase());
  if (filters.cityId) filtered = filtered.filter(a => a.cityId === filters.cityId);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(a => a.nombre.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q));
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

const fetchArtistsPage = async (
  page: number,
  filters: ArtistsFilters
): Promise<ArtistsPageResponse> => {
  try {
    const { sdk } = await import('@piums/sdk');
    const params: any = { page, limit: ITEMS_PER_PAGE };
    if (filters.category) params.categoria = filters.category;
    if (filters.cityId) params.ciudad = filters.cityId;
    if (filters.q) params.q = filters.q;
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

