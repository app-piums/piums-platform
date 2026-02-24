'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { Filters, type FilterConfig } from '@/components/Filters';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { sdk } from '@piums/sdk';
import type { Artist, Service } from '@piums/sdk';

type TabType = 'all' | 'artists' | 'services';
type SortOption = 'relevance' | 'rating' | 'price_asc' | 'price_desc';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'all');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 0
  ]);

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

  const sortOptions = [
    { value: 'relevance', label: 'Relevancia' },
    { value: 'rating', label: 'Mejor calificados' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
  ];

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, activeTab, sortBy]);

  useEffect(() => {
    updateURL();
  }, [query, activeTab, sortBy, selectedCategory, selectedCity, minRating, priceRange]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeTab !== 'all') params.set('tab', activeTab);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('location', selectedCity);
    if (minRating) params.set('minRating', minRating);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] > 0) params.set('maxPrice', priceRange[1].toString());

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      
      const params: any = { query, sortBy };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCity) params.cityId = selectedCity;
      if (minRating) params.minRating = parseFloat(minRating);
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] > 0) params.maxPrice = priceRange[1];

      // TODO: Replace with real API call
      // const result = await sdk.search(query, params);
      
      // Mock data
      const mockArtists: Artist[] = Array.from({ length: 8 }, (_, i) => ({
        id: `artist-${i + 1}`,
        userId: `user-${i + 1}`,
        nombre: `${query} - Artista ${i + 1}`,
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

      const mockServices: Service[] = Array.from({ length: 6 }, (_, i) => ({
        id: `service-${i + 1}`,
        artistId: `artist-${i + 1}`,
        name: `${query} - Servicio ${i + 1}`,
        description: 'Descripción detallada del servicio ofrecido con todas las características incluidas.',
        basePrice: 5000 + Math.floor(Math.random() * 15000),
        duration: 240 + Math.floor(Math.random() * 240),
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

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCity('');
    setMinRating('');
    setPriceRange([0, 0]);
  };

  const hasActiveFilters = selectedCategory || selectedCity || minRating || priceRange[0] > 0 || priceRange[1] > 0;
  const totalResults = (activeTab === 'all' || activeTab === 'artists' ? artists.length : 0) + 
                       (activeTab === 'all' || activeTab === 'services' ? services.length : 0);

  const filters: FilterConfig[] = [
    {
      type: 'select',
      name: 'category',
      label: 'Categoría',
      options: categories,
      value: selectedCategory,
      onChange: setSelectedCategory,
    },
    {
      type: 'select',
      name: 'location',
      label: 'Ubicación',
      options: cities,
      value: selectedCity,
      onChange: setSelectedCity,
    },
    {
      type: 'select',
      name: 'rating',
      label: 'Calificación',
      options: [
        { value: '', label: 'Todas' },
        { value: '4', label: '4+ estrellas' },
        { value: '4.5', label: '4.5+ estrellas' },
      ],
      value: minRating,
      onChange: setMinRating,
    },
    {
      type: 'range',
      name: 'price',
      label: 'Rango de precio',
      value: priceRange,
      onChange: setPriceRange,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Búsqueda' }
          ]}
          className="mb-6"
        />
        
        {/* Header with results count */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {query ? `Resultados para "${query}"` : 'Búsqueda'}
          </h1>
          {!loading && query && totalResults > 0 && (
            <p className="mt-2 text-gray-600">
              {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
          )}
        </div>

        {/* Filters */}
        <Filters
          filters={filters}
          onApply={performSearch}
          onClear={clearFilters}
          showApplyButton={false}
          showClearButton={false}
          className="mb-6"
        />

        {/* Tabs and Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({artists.length + services.length})
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'artists'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Artistas ({artists.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Servicios ({services.length})
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-48"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {/* Empty State */}
        {!loading && query && totalResults === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No encontramos resultados para "{query}"
              </h3>
              <p className="text-gray-600 mb-6">
                Intenta ajustar tus filtros o buscar con diferentes términos
              </p>

              {/* Suggestions */}
              <div className="max-w-md mx-auto text-left">
                <p className="text-sm font-medium text-gray-700 mb-3">Sugerencias:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verifica la ortografía de las palabras
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Usa términos más generales
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Prueba con menos filtros
                  </li>
                </ul>
              </div>

              {/* Popular Searches */}
              <div className="mt-8">
                <p className="text-sm font-medium text-gray-700 mb-3">Búsquedas populares:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['DJ', 'Fotografía', 'Catering', 'Banda en vivo', 'Decoración'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push('/artists')} variant="primary">
                  Ver todos los artistas
                </Button>
                <Button onClick={() => clearFilters()} variant="outline">
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Query State */}
        {!loading && !query && (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Busca artistas y servicios
              </h3>
              <p className="text-gray-600 mb-6">
                Encuentra el profesional perfecto para tu evento
              </p>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Categorías populares:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {categories.slice(1).map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setQuery(cat.label);
                        router.push(`/search?q=${encodeURIComponent(cat.label)}`);
                      }}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
                    >
                      <p className="font-medium text-gray-900">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {!loading && query && totalResults > 0 && (
          <div className="space-y-8">
            {/* Artists */}
            {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Artistas ({artists.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {(activeTab === 'all' || activeTab === 'services') && services.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Servicios ({services.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardContent>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {service.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {Math.floor(service.duration / 60)} horas
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              ${service.basePrice.toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => router.push(`/artists/${service.artistId}`)}
                              className="mt-2"
                            >
                              Ver detalles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
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
