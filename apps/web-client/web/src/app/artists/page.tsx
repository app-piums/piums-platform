'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useInfiniteArtists, type ArtistsFilters } from '@/hooks/useInfiniteArtists';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function ArtistsPage() {
  const { t } = useTranslation('artists');
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');
  
  // Filters for the query
  const filters: ArtistsFilters = {
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
    cityId: selectedCity || undefined,
  };

  // Use infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteArtists(filters);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Auto-fetch when scroll into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Categories (hardcoded for now)
  const categories = [
    { value: '', label: t('filterLabel') },
    { value: 'musica', label: t('musica', 'Música') },
    { value: 'fotografia', label: t('fotografia', 'Fotografía') },
    { value: 'catering', label: t('catering', 'Catering') },
    { value: 'decoracion', label: t('decoracion', 'Decoración') },
    { value: 'animacion', label: t('animacion', 'Animación') },
  ];

  const cities = [
    { value: '', label: t('allCities', 'Todas las ciudades') },
    { value: '1', label: t('cdmx', 'Ciudad de México') },
    { value: '2', label: t('guadalajara', 'Guadalajara') },
    { value: '3', label: t('monterrey', 'Monterrey') },
  ];

  // Update URL with current filters
  const updateURL = (params: { category?: string; location?: string; q?: string }) => {
    const urlParams = new URLSearchParams();
    
    const currentCategory = params.category ?? selectedCategory;
    const currentLocation = params.location ?? selectedCity;
    const currentQuery = params.q ?? searchQuery;
    
    if (currentCategory) urlParams.set('category', currentCategory);
    if (currentLocation) urlParams.set('location', currentLocation);
    if (currentQuery) urlParams.set('q', currentQuery);
    
    const queryString = urlParams.toString();
    router.push(`/artists${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCity('');
    router.push('/artists');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({});
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    updateURL({ category: value });
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    updateURL({ location: value });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCity;

  // Flatten all pages into a single array of artists
  const allArtists = data?.pages.flatMap((page) => page.artists) ?? [];
  const totalArtists = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="mt-2 text-gray-600">
                {t('subtitle', 'Descubre profesionales talentosos para tu evento')}
              </p>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('clearFilters', 'Limpiar filtros')}
              </Button>
            )}
          </div>
          {!isLoading && totalArtists > 0 && (
            <p className="mt-3 text-sm text-gray-500 font-medium">
              {totalArtists} {totalArtists === 1 ? t('oneArtist', 'artista encontrado') : t('manyArtists', 'artistas encontrados')}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            <Select
              options={categories}
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            />
            <Select
              options={cities}
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
            />
            <Button type="submit" fullWidth>
              {t('searchButton', 'Buscar')}
            </Button>
          </form>
        </div>

        {/* Results */}
        {isLoading && allArtists.length === 0 ? (
          <Loading />
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">{t('errorLoading', 'Error al cargar artistas')}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              {t('retry', 'Intentar de nuevo')}
            </Button>
          </div>
        ) : allArtists.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noResults')}</h3>
            <p className="mt-1 text-gray-500">{t('adjustFilters', 'Intenta ajustar los filtros de búsqueda')}</p>
          </div>
        ) : (
          <>
            {/* Artists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {allArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
                    <span className="text-gray-600">{t('loadingMore', 'Cargando más artistas...')}</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => fetchNextPage()}
                    variant="outline"
                    className="px-8"
                  >
                    {t('loadMore')}
                  </Button>
                )}
              </div>
            )}

            {/* End of results indicator */}
            {!hasNextPage && allArtists.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  {t('endOfResults', `Has visto todos los ${totalArtists} artistas disponibles`, { totalArtists })}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
