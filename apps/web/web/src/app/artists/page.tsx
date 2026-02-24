'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { sdk } from '@piums/sdk';
import type { Artist, SearchResults } from '@piums/sdk';

export default function ArtistsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');

  // Categories (hardcoded for now)
  const categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'musica', label: 'Música' },
    { value: 'fotografia', label: 'Fotografía' },
    { value: 'catering', label: 'Catering' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'animacion', label: 'Animación' },
  ];

  const cities = [
    { value: '', label: 'Todas las ciudades' },
    { value: '1', label: 'Ciudad de México' },
    { value: '2', label: 'Guadalajara' },
    { value: '3', label: 'Monterrey' },
  ];

  // Update URL with current filters and page
  const updateURL = (params: { page?: number; category?: string; location?: string; q?: string }) => {
    const urlParams = new URLSearchParams();
    
    const currentPage = params.page ?? page;
    const currentCategory = params.category ?? selectedCategory;
    const currentLocation = params.location ?? selectedCity;
    const currentQuery = params.q ?? searchQuery;
    
    if (currentPage > 1) urlParams.set('page', currentPage.toString());
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
    setPage(1);
    router.push('/artists');
  };

  useEffect(() => {
    loadArtists();
  }, [page, selectedCategory, selectedCity]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: 12,
      };
      
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCity) params.cityId = selectedCity;
      if (searchQuery) params.q = searchQuery;

      const result = await sdk.getArtists(params);
      setArtists(result.artists);
      setTotalPages(result.totalPages);
      setTotal(result.total || result.artists.length);
      
      // Update URL after successful load
      updateURL({});
    } catch (err: any) {
      console.error('Error loading artists:', err);
      
      // Mock data for development
      const mockTotal = 48;
      const mockArtists: Artist[] = Array.from({ length: 12 }, (_, i) => ({
        id: `artist-${(page - 1) * 12 + i + 1}`,
        userId: `user-${i + 1}`,
        nombre: `Artista ${(page - 1) * 12 + i + 1}`,
        slug: `artista-${i + 1}`,
        bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
        category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1].label,
        rating: 4 + Math.random(),
        reviewsCount: Math.floor(Math.random() * 50) + 5,
        bookingsCount: Math.floor(Math.random() * 100) + 10,
        experienceYears: Math.floor(Math.random() * 10) + 2,
        isVerified: Math.random() > 0.5,
        isActive: true,
        isPremium: Math.random() > 0.7,
        createdAt: new Date().toISOString(),
        cityId: 'Ciudad de México',
      }));
      
      setArtists(mockArtists);
      setTotalPages(Math.ceil(mockTotal / 12));
      setTotal(mockTotal);
      
      // Update URL even with mock data
      updateURL({});
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL({ page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCity;
  const startResult = (page - 1) * 12 + 1;
  const endResult = Math.min(page * 12, total);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Artistas' }
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Artistas</h1>
              <p className="mt-2 text-gray-600">
                Descubre profesionales talentosos para tu evento
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
                Limpiar filtros
              </Button>
            )}
          </div>
          {!loading && total > 0 && (
            <p className="mt-3 text-sm text-gray-500 font-medium">
              {total} {total === 1 ? 'artista encontrado' : 'artistas encontrados'}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nombre..."
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
              Buscar
            </Button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadArtists} className="mt-4">
              Intentar de nuevo
            </Button>
          </div>
        ) : !artists || artists.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron artistas</h3>
            <p className="mt-1 text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            {/* Results count indicator */}
            {total > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {startResult}-{endResult} de {total} resultados
              </div>
            )}

            {/* Artists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {artists?.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results info on left */}
                <div className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </div>

                {/* Pagination controls in center */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      // Show first page, last page, current page and neighbors
                      let pageNum: number;
                      
                      if (totalPages <= 7) {
                        // Show all pages
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        // Near start
                        if (i < 5) pageNum = i + 1;
                        else if (i === 5) return <span key="ellipsis1" className="px-2 text-gray-400">...</span>;
                        else pageNum = totalPages;
                      } else if (page >= totalPages - 3) {
                        // Near end
                        if (i === 0) pageNum = 1;
                        else if (i === 1) return <span key="ellipsis1" className="px-2 text-gray-400">...</span>;
                        else pageNum = totalPages - (6 - i);
                      } else {
                        // Middle
                        if (i === 0) pageNum = 1;
                        else if (i === 1) return <span key="ellipsis1" className="px-2 text-gray-400">...</span>;
                        else if (i === 5) return <span key="ellipsis2" className="px-2 text-gray-400">...</span>;
                        else if (i === 6) pageNum = totalPages;
                        else pageNum = page + i - 3;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[2.5rem] px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pageNum === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente
                  </Button>
                </div>

                {/* Empty space for balance on right */}
                <div className="hidden sm:block w-32"></div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
