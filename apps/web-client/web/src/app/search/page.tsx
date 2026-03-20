'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { Artist, Service } from '@piums/sdk';

type TabType = 'all' | 'artists' | 'services';
type SortOption = 'relevance' | 'rating' | 'price_asc' | 'price_desc';

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'musica', label: 'Música' },
  { value: 'fotografia', label: 'Fotografía' },
  { value: 'catering', label: 'Catering' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'animacion', label: 'Animación' },
];
const CITIES = [
  { value: '', label: 'Todas las ciudades' },
  { value: '1', label: 'Ciudad de México' },
  { value: '2', label: 'Guadalajara' },
  { value: '3', label: 'Monterrey' },
];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance',  label: 'Relevancia' },
  { value: 'rating',     label: 'Mejor calificados' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];
const POPULAR = ['DJ', 'Fotografía', 'Catering', 'Banda en vivo', 'Decoración'];

function SearchContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'all');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');

  useEffect(() => {
    if (query) performSearch();
  }, [query, activeTab, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async () => {
    try {
      setLoading(true);
      // Mock data (replace with real SDK call later)
      const mockArtists: Artist[] = Array.from({ length: 8 }, (_, i) => ({
        id: `artist-${i + 1}`,
        userId: `user-${i + 1}`,
        nombre: `${query} - Artista ${i + 1}`,
        slug: `artista-${i + 1}`,
        bio: 'Profesional con experiencia en eventos de todo tipo. Calidad garantizada.',
        category: CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1].label,
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
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('location', selectedCity);
    router.push(`/search${params.toString() ? `?${params}` : ''}`);
    performSearch();
  };

  const totalResults = artists.length + services.length;
  const visibleArtists = activeTab === 'services' ? [] : artists;
  const visibleServices = activeTab === 'artists' ? [] : services;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buscar</h1>
            <p className="text-sm text-gray-400">Encuentra el profesional perfecto para tu evento</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile title */}
          <div className="lg:hidden mb-4">
            <h1 className="text-xl font-bold text-gray-900">Buscar</h1>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition"
                />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e05e00] transition-colors">
                Buscar
              </button>
            </div>
            <div className="flex gap-3">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] text-gray-700">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] text-gray-700">
                {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] text-gray-700">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </form>

          {/* No query state */}
          {!query && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-8 w-8 text-[#FF6A00]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Busca artistas y servicios</h3>
              <p className="text-gray-500 text-sm mb-6">Ingresa un término de búsqueda o elige una categoría popular</p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR.map(term => (
                  <button key={term}
                    onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); }}
                    className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#FF6A00] text-sm font-medium rounded-xl transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#FF6A00]" />
            </div>
          )}

          {/* No results */}
          {!loading && query && totalResults === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <SearchIcon className="h-7 w-7 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">No se encontraron resultados para &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400">Intenta con otros términos o ajusta los filtros</p>
            </div>
          )}

          {/* Results */}
          {!loading && query && totalResults > 0 && (
            <div className="space-y-6">
              {/* Tabs + count */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {([['all','Todos'], ['artists','Artistas'], ['services','Servicios']] as const).map(([key, lbl]) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {lbl} ({key === 'all' ? totalResults : key === 'artists' ? artists.length : services.length})
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400">{totalResults} resultados</p>
              </div>

              {/* Artist results */}
              {visibleArtists.length > 0 && (
                <div>
                  {activeTab === 'all' && <h2 className="font-semibold text-gray-900 mb-3">Artistas ({artists.length})</h2>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleArtists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
                  </div>
                </div>
              )}

              {/* Service results */}
              {visibleServices.length > 0 && (
                <div>
                  {activeTab === 'all' && <h2 className="font-semibold text-gray-900 mb-3">Servicios ({services.length})</h2>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleServices.map(service => (
                      <div key={service.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                            <p className="text-xs text-gray-400 mt-2">{Math.floor((service.duration ?? 0) / 60)} horas</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold text-[#FF6A00]">${service.basePrice.toLocaleString()}</p>
                            <button
                              onClick={() => router.push(`/artists/${service.artistId}`)}
                              className="mt-2 text-xs font-medium text-[#FF6A00] border border-[#FF6A00]/30 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
