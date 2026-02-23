'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { sdk } from '@piums/sdk';
import type { Artist, SearchResults } from '@piums/sdk';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

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

      const result = await sdk.getArtists(params);
      setArtists(result.data);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Error loading artists:', err);
      
      // Mock data for development
      const mockArtists: Artist[] = Array.from({ length: 9 }, (_, i) => ({
        id: `artist-${i + 1}`,
        userId: `user-${i + 1}`,
        nombre: `Artista ${i + 1}`,
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
      setTotalPages(3);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadArtists();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Artistas</h1>
          <p className="mt-2 text-gray-600">
            Descubre profesionales talentosos para tu evento
          </p>
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
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
            
            <Select
              options={cities}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
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
        ) : artists.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron artistas</h3>
            <p className="mt-1 text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            {/* Artists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
