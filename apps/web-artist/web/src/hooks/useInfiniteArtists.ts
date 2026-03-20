import { useInfiniteQuery } from '@tanstack/react-query';
import { sdk } from '@piums/sdk';
import type { Artist } from '@piums/sdk';

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

interface ArtistQueryParams {
  page: number;
  limit: number;
  category?: string;
  cityId?: string;
  q?: string;
}

const ITEMS_PER_PAGE = 12;

// Mock data generator for development
const generateMockArtists = (page: number, filters: ArtistsFilters): ArtistsPageResponse => {
  const categories = ['Música', 'Fotografía', 'Catering', 'Decoración', 'Animación'];
  const cities = ['Ciudad de México', 'Guadalajara', 'Monterrey'];
  
  const mockTotal = 48;
  const mockArtists: Artist[] = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => ({
    id: `artist-${(page - 1) * ITEMS_PER_PAGE + i + 1}`,
    userId: `user-${i + 1}`,
    nombre: filters.q ? `${filters.q} ${(page - 1) * ITEMS_PER_PAGE + i + 1}` : `Artista ${(page - 1) * ITEMS_PER_PAGE + i + 1}`,
    slug: `artista-${(page - 1) * ITEMS_PER_PAGE + i + 1}`,
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    category: filters.category || categories[Math.floor(Math.random() * categories.length)],
    rating: 4 + Math.random(),
    reviewsCount: Math.floor(Math.random() * 50) + 5,
    bookingsCount: Math.floor(Math.random() * 100) + 10,
    experienceYears: Math.floor(Math.random() * 10) + 2,
    isVerified: Math.random() > 0.5,
    isActive: true,
    isPremium: Math.random() > 0.7,
    createdAt: new Date().toISOString(),
    cityId: filters.cityId || cities[Math.floor(Math.random() * cities.length)],
  }));

  const totalPages = Math.ceil(mockTotal / ITEMS_PER_PAGE);
  
  return {
    artists: mockArtists,
    total: mockTotal,
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
    const params: ArtistQueryParams = {
      page,
      limit: ITEMS_PER_PAGE,
    };

    if (filters.category) params.category = filters.category;
    if (filters.cityId) params.cityId = filters.cityId;
    if (filters.q) params.q = filters.q;

    const result = await sdk.getArtists(params);
    
    return {
      artists: result.artists,
      total: result.total || result.artists.length,
      page: result.page || page,
      totalPages: result.totalPages,
      hasNextPage: page < result.totalPages,
    };
  } catch (error) {
    console.log('API error, using mock data:', error);
    // Return mock data if API fails
    return generateMockArtists(page, filters);
  }
};

export function useInfiniteArtists(filters: ArtistsFilters) {
  return useInfiniteQuery({
    queryKey: ['artists', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtistsPage(pageParam, filters),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
