'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import ClientSidebar from '@/components/ClientSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { sdk, Artist, Booking } from '@piums/sdk';

// Colors for artist avatar placeholders
const COLORS = [
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-teal-400 to-cyan-600',
  'from-blue-400 to-indigo-600',
  'from-green-400 to-emerald-600',
];

function MiniCalendar({ bookings }: { bookings: Booking[] }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames = ['L','M','M','J','V','S','D'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Helper: resolve the booking's date regardless of which field name the backend uses
  const getBookingDate = (b: Booking): Date | null => {
    const raw = b.startAt || b.scheduledDate;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  // Build a map of booked days from real booking data
  const bookedDays: Record<number, { label: string; color: string; id: string }> = {};
  bookings.forEach(b => {
    const d = getBookingDate(b);
    if (!d) return;
    if (d.getMonth() === month && d.getFullYear() === year) {
      bookedDays[d.getDate()] = {
        label: b.serviceName || 'Reserva',
        color: 'bg-orange-400',
        id: b.id,
      };
    }
  });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const upcomingBookings = bookings
    .map(b => ({ booking: b, date: getBookingDate(b) }))
    .filter(({ date }) => date && date >= now)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .slice(0, 4)
    .map(({ booking }) => booking);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">{monthNames[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const event = bookedDays[day];
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-colors
                ${isToday ? 'bg-[#FF6A00] text-white' : event ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                {day}
              </div>
              {event && (
                <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${event.color}`} title={event.label} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Sin reservas próximas</p>
        ) : (
          upcomingBookings.map(b => (
            <Link key={b.id} href={`/bookings`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-orange-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{b.serviceName || 'Reserva'}</p>
                <p className="text-xs text-gray-400">{(() => { const raw = b.startAt || b.scheduledDate; return raw ? new Date(raw).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; })()}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link href="/booking" className="mt-5 w-full py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00] transition-colors flex items-center justify-center">
        + Agendar proyecto
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [recommendedArtists, setRecommendedArtists] = useState<Artist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [artistsRes, bookingsRes] = await Promise.allSettled([
        sdk.getArtists({ limit: 8 } as any),
        sdk.listBookings({ limit: 20 }),
      ]);

      if (artistsRes.status === 'fulfilled') {
        setRecommendedArtists(artistsRes.value.artists?.slice(0, 4) ?? []);
      }
      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.bookings ?? []);
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadData();
  }, [isAuthenticated, loadData]);

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const displayName = user?.nombre ?? 'Usuario';

  const resolveDate = (b: Booking) => { const raw = b.startAt || b.scheduledDate; return raw ? new Date(raw) : null; };
  const nextBooking = bookings
    .map(b => ({ b, d: resolveDate(b) }))
    .filter(({ d }) => d && d > new Date())
    .sort((a, z) => a.d!.getTime() - z.d!.getTime())
    .map(({ b }) => b)[0];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={displayName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">¡Hola, {displayName}! 👋</h1>
            <p className="text-sm text-gray-400">Descubre el mejor talento creativo cerca de ti</p>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={(e) => { e.preventDefault(); router.push(`/artists?q=${search}`); }} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar artistas, estilos..."
                className="pl-9 pr-4 py-2 w-72 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
              />
            </form>
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
          <div className="lg:hidden mb-5">
            <h1 className="text-xl font-bold text-gray-900">¡Hola, {displayName}! 👋</h1>
            <p className="text-sm text-gray-400 mt-0.5">Descubre el mejor talento creativo cerca de ti</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/artists?q=${search}`); }} className="relative lg:hidden mb-5">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artistas, estilos..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
            />
          </form>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Calendar with real bookings */}
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Reservas del Mes</h2>
                <Link href="/bookings" className="text-sm text-[#FF6A00] font-medium hover:underline">
                  Ver todas →
                </Link>
              </div>
              {loadingData ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
              ) : (
                <MiniCalendar bookings={bookings} />
              )}
            </div>

            {/* Right column */}
            <div className="lg:w-72 shrink-0 space-y-4">
              {/* Nearby Creatives */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Creativos Cerca de Ti</h2>
                <div className="h-36 rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 relative overflow-hidden mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,#94a3b8 0,#94a3b8 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 1px,transparent 1px,transparent 40px)' }}
                  />
                  <div className="relative z-10 bg-[#FF6A00] text-white h-8 w-8 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{recommendedArtists.length > 0 ? `${recommendedArtists.length} artistas registrados` : 'Explora artistas'}</p>
                    <div className="flex -space-x-2 mt-1">
                      {recommendedArtists.slice(0, 3).map((a, i) => (
                        <div key={a.id} className={`h-6 w-6 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} border-2 border-white flex items-center justify-center text-white text-[8px] font-bold`}>
                          {a.nombre?.charAt(0) ?? '?'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link href="/artists" className="text-xs font-semibold text-[#FF6A00] border border-[#FF6A00]/30 rounded-lg px-3 py-1.5 hover:bg-[#FF6A00]/5 transition-colors">
                    Ver galería
                  </Link>
                </div>
              </div>

              {/* Next session — real data */}
              <div className="bg-gray-900 rounded-2xl p-5 text-white">
                <p className="text-xs text-gray-400 mb-1">Próxima Sesión</p>
                {nextBooking ? (
                  <>
                    <p className="font-semibold">{nextBooking.serviceName ?? 'Reserva pendiente'}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {(() => { const raw = nextBooking.startAt || nextBooking.scheduledDate; return raw ? new Date(raw).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'short' }) : '—'; })()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Sin sesiones próximas</p>
                    <p className="text-sm text-gray-400 mt-0.5">Agenda tu primer evento</p>
                  </>
                )}
                <div className="h-16 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 mt-3 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <Link href="/bookings" className="mt-3 block text-center text-sm font-medium text-[#FF6A00] hover:underline">
                  Ver detalles →
                </Link>
              </div>
            </div>
          </div>

          {/* Recommended Artists — real data */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recomendados para Ti</h2>
              <Link href="/artists" className="text-sm text-[#FF6A00] font-medium hover:underline">Ver todos →</Link>
            </div>
            {loadingData ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl animate-pulse h-40 border border-gray-100" />
                ))}
              </div>
            ) : recommendedArtists.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
                <p className="text-sm">No hay artistas disponibles aún.</p>
                <Link href="/artists" className="text-[#FF6A00] text-sm font-medium mt-2 inline-block">Explorar →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {recommendedArtists.map((artist, idx) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className={`h-24 sm:h-32 bg-gradient-to-br ${COLORS[idx % COLORS.length]} relative flex items-center justify-center`}>
                      {artist.coverPhoto ? (
                        <img src={artist.coverPhoto} alt={artist.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-4xl font-bold opacity-50">{artist.nombre?.charAt(0) ?? '?'}</span>
                      )}
                      {artist.rating && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                          <svg className="h-3 w-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-800">{artist.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{artist.nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{artist.category ?? artist.categoria ?? '—'}</p>
                      {artist.precioDesde && (
                        <p className="text-sm font-bold text-[#FF6A00] mt-1">desde Q{artist.precioDesde}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
