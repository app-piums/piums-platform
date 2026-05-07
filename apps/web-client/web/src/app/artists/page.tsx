'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { useInfiniteArtists, type ArtistsFilters } from '@/hooks/useInfiniteArtists';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencyToggle } from '@/contexts/CurrencyContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { NotificationBell } from '@/components/NotificationBell';
import { LocationPermissionPrompt } from '@/components/LocationPermissionPrompt';
import { sdk } from '@piums/sdk';

const CATEGORIES = [
  { value: '',           label: 'Todas las categorías' },
  { value: 'MUSICO',     label: 'Músico' },
  { value: 'DJ',         label: 'DJ / Productor' },
  { value: 'FOTOGRAFO',  label: 'Fotógrafo' },
  { value: 'VIDEOGRAFO', label: 'Videógrafo' },
  { value: 'DISENADOR',  label: 'Diseñador Gráfico' },
  { value: 'BAILARIN',   label: 'Bailarín / Coreógrafo' },
  { value: 'ANIMADOR',   label: 'Animador / MC' },
  { value: 'TATUADOR',   label: 'Tatuador' },
  { value: 'MAQUILLADOR',label: 'Maquillador / FX' },
  { value: 'PINTOR',     label: 'Pintor / Ilustrador' },
  { value: 'ESCULTOR',   label: 'Escultor' },
  { value: 'ESCRITOR',   label: 'Escritor / Letrista' },
  { value: 'MAGO',       label: 'Mago / Ilusionista' },
  { value: 'ACROBATA',   label: 'Acróbata / Circo' },
  { value: 'OTRO',       label: 'Otro' },
];

const CITIES_BY_COUNTRY: Record<string, { label: string; regions: { value: string; label: string }[] }> = {
  GT: {
    label: 'Todos los departamentos',
    regions: [
      { value: 'Guatemala',         label: 'Guatemala' },
      { value: 'Sacatepéquez',      label: 'Sacatepéquez' },
      { value: 'Chimaltenango',     label: 'Chimaltenango' },
      { value: 'Escuintla',         label: 'Escuintla' },
      { value: 'Santa Rosa',        label: 'Santa Rosa' },
      { value: 'Sololá',            label: 'Sololá' },
      { value: 'Totonicapán',       label: 'Totonicapán' },
      { value: 'Quetzaltenango',    label: 'Quetzaltenango' },
      { value: 'Suchitepéquez',     label: 'Suchitepéquez' },
      { value: 'Retalhuleu',        label: 'Retalhuleu' },
      { value: 'San Marcos',        label: 'San Marcos' },
      { value: 'Huehuetenango',     label: 'Huehuetenango' },
      { value: 'Quiché',            label: 'Quiché' },
      { value: 'Baja Verapaz',      label: 'Baja Verapaz' },
      { value: 'Alta Verapaz',      label: 'Alta Verapaz' },
      { value: 'Petén',             label: 'Petén' },
      { value: 'Izabal',            label: 'Izabal' },
      { value: 'Zacapa',            label: 'Zacapa' },
      { value: 'Chiquimula',        label: 'Chiquimula' },
      { value: 'Jalapa',            label: 'Jalapa' },
      { value: 'Jutiapa',           label: 'Jutiapa' },
      { value: 'El Progreso',       label: 'El Progreso' },
    ],
  },
  MX: {
    label: 'Todos los estados',
    regions: [
      { value: 'Ciudad de México',  label: 'Ciudad de México' },
      { value: 'Jalisco',           label: 'Jalisco' },
      { value: 'Nuevo León',        label: 'Nuevo León' },
      { value: 'Puebla',            label: 'Puebla' },
      { value: 'Guanajuato',        label: 'Guanajuato' },
      { value: 'Veracruz',          label: 'Veracruz' },
      { value: 'Estado de México',  label: 'Estado de México' },
      { value: 'Chihuahua',         label: 'Chihuahua' },
      { value: 'Yucatán',           label: 'Yucatán' },
      { value: 'Oaxaca',            label: 'Oaxaca' },
    ],
  },
  HN: {
    label: 'Todos los departamentos',
    regions: [
      { value: 'Francisco Morazán', label: 'Francisco Morazán' },
      { value: 'Cortés',            label: 'Cortés' },
      { value: 'Olancho',           label: 'Olancho' },
      { value: 'Yoro',              label: 'Yoro' },
      { value: 'Choluteca',         label: 'Choluteca' },
    ],
  },
  SV: {
    label: 'Todos los departamentos',
    regions: [
      { value: 'San Salvador',      label: 'San Salvador' },
      { value: 'Santa Ana',         label: 'Santa Ana' },
      { value: 'San Miguel',        label: 'San Miguel' },
      { value: 'La Libertad',       label: 'La Libertad' },
      { value: 'Sonsonate',         label: 'Sonsonate' },
    ],
  },
  CR: {
    label: 'Todas las provincias',
    regions: [
      { value: 'San José',           label: 'San José' },
      { value: 'Alajuela',          label: 'Alajuela' },
      { value: 'Cartago',           label: 'Cartago' },
      { value: 'Heredia',           label: 'Heredia' },
      { value: 'Guanacaste',        label: 'Guanacaste' },
      { value: 'Puntarenas',        label: 'Puntarenas' },
      { value: 'Limón',             label: 'Limón' },
    ],
  },
  CO: {
    label: 'Todos los departamentos',
    regions: [
      { value: 'Bogotá',            label: 'Bogotá' },
      { value: 'Antioquia',         label: 'Antioquia' },
      { value: 'Valle del Cauca',   label: 'Valle del Cauca' },
      { value: 'Cundinamarca',      label: 'Cundinamarca' },
      { value: 'Atlántico',          label: 'Atlántico' },
    ],
  },
};

const DEFAULT_COUNTRY = 'GT';

function getCitiesForCountry(country: string) {
  const key = country.toUpperCase();
  const entry = CITIES_BY_COUNTRY[key] ?? CITIES_BY_COUNTRY[DEFAULT_COUNTRY];
  return [
    { value: '', label: entry.label },
    ...entry.regions,
  ];
}

function ArtistsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Params de contexto de evento
  const eventId = searchParams.get('eventId') || '';
  const eventDate = searchParams.get('date') || '';

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [clientCountry, setClientCountry] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('client_country') ?? '' : '')
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'price_low' | 'price_high'>('relevance');
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Debounce: wait 400ms after the user stops typing before firing the search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // IDs de artistas ocupados en la fecha del evento
  const [busyArtistIds, setBusyArtistIds] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (!eventDate) { setBusyArtistIds(new Set()); return; }
    let mounted = true;
    setLoadingAvailability(true);
    sdk.getArtistsBusyOnDate(eventDate)
      .then((res) => { if (mounted) setBusyArtistIds(new Set(res.busyArtistIds)); })
      .catch(() => { /* si falla no bloqueamos */ })
      .finally(() => { if (mounted) setLoadingAvailability(false); });
    return () => { mounted = false; };
  }, [eventDate]);

  const handleCountryDetected = useCallback((country: string) => {
    const upper = country.toUpperCase();
    localStorage.setItem('client_country', upper);
    setClientCountry(upper);
    setSelectedCity('');
  }, []);

  const cities = useMemo(() => getCitiesForCountry(clientCountry || DEFAULT_COUNTRY), [clientCountry]);

  const filters: ArtistsFilters = {
    q: debouncedQuery || undefined,
    category: selectedCategory || undefined,
    cityId: selectedCity || undefined,
    guests: guests ? parseInt(guests, 10) : undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteArtists(filters);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateURL = (params: { category?: string; location?: string; q?: string; guests?: string }) => {
    const urlParams = new URLSearchParams();
    const cat = params.category ?? selectedCategory;
    const loc = params.location ?? selectedCity;
    const q   = params.q ?? searchQuery;
    const g   = params.guests ?? guests;
    if (cat) urlParams.set('category', cat);
    if (loc) urlParams.set('location', loc);
    if (q)   urlParams.set('q', q);
    if (g)   urlParams.set('guests', g);
    // Preservar contexto de evento
    if (eventId)   urlParams.set('eventId', eventId);
    if (eventDate) urlParams.set('date', eventDate);
    const qs = urlParams.toString();
    router.push(`/artists${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCity('');
    setGuests('');
    router.push('/artists');
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateURL({}); };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCity || guests;
  const allArtists = data?.pages.flatMap(p => p.artists) ?? [];
  const totalArtists = data?.pages[0]?.total ?? 0;

  const activeFilterCount = [minRating > 0, minPrice !== '', maxPrice !== '', showVerifiedOnly].filter(Boolean).length;

  // hourlyRateMin is stored in cents in the artists-service DB → divide by 100 to get USD
  const artistPriceUSD = (a: any): number | null => {
    if (a.hourlyRateMin != null) return a.hourlyRateMin / 100;
    if (a.mainServicePrice != null) return a.mainServicePrice;
    return null;
  };

  const displayedArtists = (() => {
    let result = allArtists.filter(a => {
      if (showVerifiedOnly) {
        const verified = (a as any).verificationStatus === 'VERIFIED' || (a as any).isVerified === true;
        if (!verified) return false;
      }
      if (minRating > 0 && ((a as any).rating ?? 0) < minRating) return false;
      const price = artistPriceUSD(a as any);
      if (minPrice && price !== null && price < parseFloat(minPrice)) return false;
      if (maxPrice && price !== null && price > parseFloat(maxPrice)) return false;
      return true;
    });
    if (sortBy !== 'relevance') {
      result = [...result].sort((a, b) => {
        if (sortBy === 'rating') return ((b as any).rating ?? 0) - ((a as any).rating ?? 0);
        const pa = artistPriceUSD(a as any) ?? (sortBy === 'price_low' ? Infinity : 0);
        const pb = artistPriceUSD(b as any) ?? (sortBy === 'price_low' ? Infinity : 0);
        return sortBy === 'price_low' ? pa - pb : pb - pa;
      });
    }
    return result;
  })();

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
        <PageHelpButton tourId="artistsTour" />
      <LocationPermissionPrompt onCountryDetected={handleCountryDetected} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Explorar Artistas</h1>
            {eventDate ? (
              <p className="text-sm text-[#FF6A00] font-medium">
                Disponibilidad para el {new Date(eventDate + 'T12:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Descubre profesionales talentosos para tu evento</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CurrencyToggle />
            <NotificationBell />
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <XIcon className="h-4 w-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile title */}
          <div className="lg:hidden mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Explorar Artistas</h1>
              {eventDate ? (
                <p className="text-sm text-[#FF6A00] font-medium mt-0.5">
                  Disponibilidad: {new Date(eventDate + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-0.5">Encuentra el talento perfecto para tu evento</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <CurrencyToggle />
              <NotificationBell />
            </div>
          </div>

          {/* Filters */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            {/* Main search bar */}
            <div className="relative mb-3">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre, ciudad, estilo... (ej: músico, DJ, fotografía)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); updateURL({ category: e.target.value }); }}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select
                value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); updateURL({ location: e.target.value }); }}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              >
                {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={e => setGuests(e.target.value)}
                placeholder="# personas"
                className="w-28 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              />
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              >
                <option value="relevance">Relevancia</option>
                <option value="rating">Mejor valorados</option>
                <option value="price_low">Precio: menor a mayor</option>
                <option value="price_high">Precio: mayor a menor</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e05e00] transition-colors"
              >
                Buscar
              </button>
              {/* Advanced filters */}
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors flex items-center gap-2 ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm shadow-orange-200'
                    : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 h-4 w-4 rounded-full bg-white text-[#FF6A00] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Rating */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Calificación mínima</label>
                    <StarRatingFilter value={minRating} onChange={setMinRating} />
                  </div>

                  {/* Price range */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Precio por hora (USD)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        placeholder="Mín"
                        min={0}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition"
                      />
                      <span className="text-gray-300 font-medium shrink-0">—</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="Máx"
                        min={0}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition"
                      />
                    </div>
                  </div>

                  {/* Verified */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Verificación</label>
                    <button
                      type="button"
                      onClick={() => setShowVerifiedOnly(v => !v)}
                      className={`w-full text-sm py-2.5 rounded-xl border transition-all font-semibold flex items-center gap-2 justify-center ${
                        showVerifiedOnly
                          ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm shadow-orange-200'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                      }`}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Solo verificados
                    </button>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMinRating(0); setMinPrice(''); setMaxPrice(''); setShowVerifiedOnly(false); }}
                      className="text-xs text-gray-400 hover:text-[#FF6A00] transition-colors font-medium"
                    >
                      Limpiar filtros avanzados
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Count badge */}
          {!isLoading && allArtists.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500 font-medium">
                <span className="text-[#FF6A00] font-semibold">{displayedArtists.length}</span>
                {activeFilterCount > 0 && displayedArtists.length !== totalArtists
                  ? ` de ${totalArtists} artistas`
                  : ` artista${displayedArtists.length !== 1 ? 's' : ''} encontrado${displayedArtists.length !== 1 ? 's' : ''}`}
              </p>
              {eventDate && !loadingAvailability && busyArtistIds.size > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  {busyArtistIds.size} {busyArtistIds.size === 1 ? 'artista ocupado' : 'artistas ocupados'} en esta fecha
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {isLoading && allArtists.length === 0 ? (
            <Loading />
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <XIcon className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-gray-700 font-medium">Error al cargar artistas</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-[#FF6A00] hover:underline font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : displayedArtists.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                <SearchIcon className="h-7 w-7 text-[#FF6A00]" />
              </div>
              <p className="text-gray-700 font-medium">No se encontraron artistas</p>
              <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-[#FF6A00] hover:underline font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                {displayedArtists.map(artist => (
                  <div key={artist.id} className="relative">
                    {busyArtistIds.has(artist.id) && (
                      <div className="absolute inset-0 z-10 rounded-2xl bg-gray-900/50 flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          No disponible
                        </span>
                        <span className="text-white text-xs opacity-80">Ya tiene reserva este día</span>
                      </div>
                    )}
                    <ArtistCard artist={artist} />
                  </div>
                ))}
              </div>

              {hasNextPage && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#FF6A00]" />
                      Cargando más artistas...
                    </div>
                  ) : (
                    <button
                      onClick={() => fetchNextPage()}
                      className="px-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cargar más
                    </button>
                  )}
                </div>
              )}

              {!hasNextPage && allArtists.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  Has visto todos los {totalArtists} artistas disponibles
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loading />
        </div>
      )}
    >
      <ArtistsPageContent />
    </Suspense>
  );
}

function StarRatingFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered > 0 ? hovered : value;
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-125 focus:outline-none"
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
        >
          <svg className="h-7 w-7 drop-shadow-sm" viewBox="0 0 20 20"
            fill={star <= active ? '#00AEEF' : 'none'}
            stroke={star <= active ? '#00AEEF' : '#D1D5DB'}
            strokeWidth={1.2}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

