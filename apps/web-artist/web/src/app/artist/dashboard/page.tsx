'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { StatsCards } from '@/components/artist/StatsCards';
import { sdk, Booking } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError, isArtistNotFoundError } from '@/lib/errors';
import { LocationPermissionPrompt } from '@/components/LocationPermissionPrompt';
import { ThemeToggle } from '@/contexts/ThemeContext';

type ArtistStats = Awaited<ReturnType<typeof sdk.getArtistStats>>;
type AugmentedArtistStats = ArtistStats & {
  profileViews?: number;
  earningsGrowth?: number;
  profileViewsGrowth?: number;
};

export default function ArtistDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AugmentedArtistStats | null>(null);
  const artistCountryRef = useRef<string | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [artistServices, setArtistServices] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, bookingsData, profileData] = await Promise.allSettled([
        sdk.getArtistStats(),
        sdk.getArtistBookings({ status: 'CONFIRMED', limit: 10 }),
        sdk.getArtistProfile(),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (profileData.status === 'fulfilled') {
        const profile = profileData.value as any;
        artistCountryRef.current = profile?.country ?? null;
        setArtistProfile(profile);
        if (profile?.id) {
          sdk.getArtistServices(profile.id)
            .then((services) => setArtistServices(services))
            .catch(() => { /* non-critical */ });
        }
      }
      if (bookingsData.status === 'fulfilled') {
        const now = new Date();
        const upcoming = (bookingsData.value?.bookings ?? [])
          .filter((b: Booking) => {
            const d = b.startAt || b.scheduledDate;
            return d && new Date(d) >= now;
          })
          .sort((a: Booking, b: Booking) => {
            const da = new Date(a.startAt || a.scheduledDate).getTime();
            const db = new Date(b.startAt || b.scheduledDate).getTime();
            return da - db;
          });
        setUpcomingBookings(upcoming);
      }

      // Si todos fallaron, lanzar error para mostrar UI de error al usuario
      const allFailed = [statsData, bookingsData, profileData].every(r => r.status === 'rejected');
      if (allFailed) throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading dashboard:', message);
      setError(message || 'Error al cargar el dashboard');

      if (isArtistNotFoundError(err)) {
        document.cookie = 'onboarding_completed=false; path=/; max-age=86400; SameSite=strict';
        router.push('/artist/onboarding');
      } else if (isUnauthorizedError(err)) {
        router.push('/login?redirect=/artist/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const handleCountryDetected = useCallback(async (detected: string) => {
    const homeCountry = artistCountryRef.current;
    try {
      const code = detected.toUpperCase();
      if (homeCountry && code !== homeCountry.toUpperCase()) {
        // Artist is outside their home country — apply WORKING_ABROAD geo-absence
        await sdk.updateGeoCountry(code);
      } else {
        // Artist is back home — clear geo-absence
        await sdk.updateGeoCountry(null);
      }
    } catch (err) {
      console.error('Error actualizando geolocalización:', err);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <PageHelpButton tourId="artistTour" />
        <main className="flex-1 p-4 pt-20 sm:p-8 lg:pt-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 pt-20 sm:p-8 lg:pt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <LocationPermissionPrompt onCountryDetected={handleCountryDetected} />
      
      {/* pt-16 on mobile to clear the fixed top bar, no extra padding on lg */}
      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Resumen del Dashboard</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{currentDate}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => router.push('/artist/dashboard/services?create=1')}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Crear servicio</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div id="artist-dashboard-stats" className="mb-6">
              <StatsCards
                bookingsThisMonth={stats.bookings.thisMonth}
                totalRevenue={stats.revenue.total}
                averageRating={stats.rating.average}
                totalReviews={stats.rating.totalReviews}
                pendingBookings={stats.bookings.pending}
                confirmedBookings={stats.bookings.confirmed}
                profileViews={stats.profileViews}
                earningsGrowth={stats.earningsGrowth}
                profileViewsGrowth={stats.profileViewsGrowth}
              />
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Due Soon Card */}
            <div id="artist-dashboard-upcoming" className="lg:col-span-2">
              {upcomingBookings.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full mb-3">
                        PRÓXIMO
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {upcomingBookings[0].serviceName || upcomingBookings[0].code || 'Reserva'}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {new Date(upcomingBookings[0].startAt || upcomingBookings[0].scheduledDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{(() => {
                          const d = new Date(upcomingBookings[0].startAt || upcomingBookings[0].scheduledDate);
                          const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return diff <= 0 ? 'Hoy' : diff === 1 ? 'Mañana' : `En ${diff} días`;
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold text-gray-900">
                          ${(upcomingBookings[0].totalPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => router.push('/artist/dashboard/bookings')}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Sin próximas presentaciones</p>
                  <p className="text-sm text-gray-500 mt-1">Tus reservas confirmadas aparecerán aquí</p>
                </div>
              )}
            </div>

            {/* Profile Strength Card */}
            <div id="artist-dashboard-profile-strength" className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Fortaleza del Perfil</h3>
              {(() => {
                const checks = [
                  { label: 'Foto de perfil agregada', done: !!(artistProfile?.imageUrl || artistProfile?.profilePicture) },
                  { label: 'Descripción de perfil', done: !!(artistProfile?.bio && artistProfile.bio.length > 10) },
                  { label: 'Servicios publicados', done: artistServices.length > 0 },
                  { label: 'Redes sociales vinculadas', done: !!(artistProfile?.socialLinks && Object.values(artistProfile.socialLinks).some((v: any) => !!v)) },
                  { label: 'Primera reseña obtenida', done: !!(stats && (stats.rating?.totalReviews ?? 0) > 0) },
                ];
                const pct = artistProfile
                  ? Math.round((checks.filter(c => c.done).length / checks.length) * 100)
                  : 0;
                return (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Completado</span>
                        <span className="text-2xl font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {checks.map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500' : 'bg-gray-600'}`}>
                            {done ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${done ? 'text-gray-300' : 'text-gray-400'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Revenue Overview Chart */}
          <div id="artist-dashboard-revenue" className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Resumen de Ingresos</h3>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>Últimos 6 meses</option>
                <option>Últimos 12 meses</option>
                <option>Este año</option>
              </select>
            </div>
            
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 800 250">
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#fb923c" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                {/* Y-axis labels */}
                <text x="10" y="20" className="text-xs fill-gray-500">Q15k</text>
                <text x="10" y="80" className="text-xs fill-gray-500">Q10k</text>
                <text x="10" y="140" className="text-xs fill-gray-500">Q5k</text>
                <text x="18" y="200" className="text-xs fill-gray-500">Q0</text>
                
                {/* Chart area */}
                <path
                  d="M 80 180 L 180 140 L 280 160 L 380 100 L 480 120 L 580 60 L 680 80"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                <path
                  d="M 80 180 L 180 140 L 280 160 L 380 100 L 480 120 L 580 60 L 680 80 L 680 200 L 80 200 Z"
                  fill="url(#revenueGradient)"
                />
                
                {/* Data points */}
                <circle cx="80" cy="180" r="5" fill="#fb923c" />
                <circle cx="180" cy="140" r="5" fill="#fb923c" />
                <circle cx="280" cy="160" r="5" fill="#fb923c" />
                <circle cx="380" cy="100" r="5" fill="#fb923c" />
                <circle cx="480" cy="120" r="5" fill="#fb923c" />
                <circle cx="580" cy="60" r="5" fill="#fb923c" />
                <circle cx="680" cy="80" r="5" fill="#fb923c" />
                
                {/* X-axis labels */}
                <text x="65" y="230" className="text-xs fill-gray-500">JAN</text>
                <text x="165" y="230" className="text-xs fill-gray-500">FEB</text>
                <text x="265" y="230" className="text-xs fill-gray-500">MAR</text>
                <text x="365" y="230" className="text-xs fill-gray-500">APR</text>
                <text x="465" y="230" className="text-xs fill-gray-500">MAY</text>
                <text x="565" y="230" className="text-xs fill-gray-500">JUN</text>
                <text x="665" y="230" className="text-xs fill-gray-500">JUL</text>
              </svg>
            </div>
          </div>

          {/* Upcoming Gigs Calendar */}
          <div id="artist-dashboard-gigs" className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Próximas Presentaciones</h3>
              <button 
                onClick={() => router.push('/artist/dashboard/calendar')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                VER TODAS
              </button>
            </div>

            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 4).map((booking: Booking) => {
                  const dateStr = booking.startAt || booking.scheduledDate;
                  const d = new Date(dateStr);
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => router.push('/artist/dashboard/bookings')}
                    >
                      <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{d.getDate()}</div>
                          <div className="text-xs text-orange-500">{d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</div>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{booking.serviceName || booking.code || 'Reserva'}</p>
                        <p className="text-sm text-gray-600">{d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${(booking.totalPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">Sin presentaciones próximas</p>
                <p className="text-sm text-gray-500">Tus reservas confirmadas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
