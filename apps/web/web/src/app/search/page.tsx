'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { sdk } from '@piums/sdk';
import type { Artist, Service } from '@piums/sdk';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'artists' | 'services'>('artists');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  const ratings = [
    { value: '', label: 'Cualquier calificación' },
    { value: '4', label: '4+ estrellas' },
    { value: '4.5', label: '4.5+ estrellas' },
  ];

  useEffect(() => {
    if (initialQuery) {
      performSearch();
    }
  }, []);

  const performSearch = async () => {
    try {
      setLoading(true);
      
      const params: any = { query };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCity) params.cityId = selectedCity;
      if (minRating) params.minRating = parseFloat(minRating);
      if (minPrice) params.minPrice = parseInt(minPrice);
      if (maxPrice) params.maxPrice = parseInt(maxPrice);

      // const result = await sdk.search(query, params);
      // setArtists(result.artists.data);
      // setServices(result.services.data);

      // Mock data
      const mockArtists: Artist[] = Array.from({ length: 6 }, (_, i) => ({
        id: `artist-${i + 1}`,
        userId: `user-${i + 1}`,
        nombre: `Artista ${i + 1}`,
        slug: `artista-${i + 1}`,
        bio: 'Profesional con experiencia en eventos de todo tipo. Calidad garantizada.',
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

      const mockServices: Service[] = Array.from({ length: 4 }, (_, i) => ({
        id: `service-${i + 1}`,
        artistId: `artist-${i + 1}`,
        name: `Servicio ${i + 1}`,
        description: 'Descripción detallada del servicio ofrecido',
        basePrice: 5000 + Math.floor(Math.random() * 15000),
        duration: 240,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));

      setArtists(mockArtists);
      setServices(mockServices);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCity('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedCity,
    minRating,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Buscar</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <Input
                placeholder="Buscar artistas, servicios, categorías..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leftIcon={
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Button type="submit" loading={loading}>
                Buscar
              </Button>
            </div>
          </form>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="info" size="sm">{activeFiltersCount}</Badge>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardTitle>Filtros</CardTitle>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select
                  label="Categoría"
                  options={categories}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                
                <Select
                  label="Ciudad"
                  options={cities}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                />
                
                <Select
                  label="Calificación mínima"
                  options={ratings}
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                />
                
                <Input
                  label="Precio mínimo"
                  type="number"
                  placeholder="$ 0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                
                <Input
                  label="Precio máximo"
                  type="number"
                  placeholder="$ Sin límite"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3 mt-4">
                <Button onClick={performSearch} fullWidth>
                  Aplicar Filtros
                </Button>
                <Button variant="outline" onClick={clearFilters} fullWidth>
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('artists')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'artists'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Artistas ({artists.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Servicios ({services.length})
            </button>
          </nav>
        </div>

        {/* Results */}
        {loading ? (
          <Loading />
        ) : (
          <>
            {activeTab === 'artists' && (
              <>
                {artists.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron artistas</h3>
                    <p className="mt-1 text-gray-500">
                      {query ? 'Intenta con otros términos de búsqueda' : 'Realiza una búsqueda para ver resultados'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artists.map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'services' && (
              <>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron servicios</h3>
                    <p className="mt-1 text-gray-500">
                      {query ? 'Intenta con otros términos de búsqueda' : 'Realiza una búsqueda para ver resultados'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <Card key={service.id} hover>
                        <CardContent>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">
                                ${service.basePrice.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">{Math.floor(service.duration / 60)} horas</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => router.push(`/booking?artistId=${service.artistId}&serviceId=${service.id}`)}
                            >
                              Reservar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Search Tips */}
        {!query && !loading && (
          <Card className="mt-8">
            <CardTitle>Consejos de búsqueda</CardTitle>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Usa palabras clave específicas como "fotografía de bodas" o "música en vivo"</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Aplica filtros para refinar los resultados por categoría, ciudad o precio</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Revisa las calificaciones y reseñas de los artistas antes de reservar</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <SearchContent />
    </Suspense>
  );
}
