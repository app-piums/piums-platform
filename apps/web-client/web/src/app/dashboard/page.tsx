'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import ClientSidebar from '@/components/ClientSidebar';

// Datos mock de artistas recomendados
const RECOMMENDED = [
  { id: '1', name: 'Sarah J.', category: 'Fotografía', rating: 4.9, price: 150, color: 'from-rose-400 to-pink-600' },
  { id: '2', name: 'Carlos M.', category: 'Música', rating: 4.8, price: 200, color: 'from-violet-400 to-purple-600' },
  { id: '3', name: 'DJ Alex', category: 'DJ', rating: 4.7, price: 180, color: 'from-amber-400 to-orange-600' },
  { id: '4', name: 'Ana R.', category: 'Video', rating: 4.9, price: 220, color: 'from-teal-400 to-cyan-600' },
];

// Eventos en el calendario (mock)
const CALENDAR_EVENTS: Record<number, { label: string; color: string }> = {
  5:  { label: 'Boda',          color: 'bg-orange-400' },
  12: { label: 'Fiesta',        color: 'bg-blue-400'   },
  19: { label: 'Corporativo',   color: 'bg-green-400'  },
  26: { label: 'XV Años',       color: 'bg-purple-400' },
};



function MiniCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames = ['L','M','M','J','V','S','D'];

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // shift so week starts Monday
  const startOffset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div>
      {/* Month nav */}
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

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const event = CALENDAR_EVENTS[day];
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-colors
                ${isToday ? 'bg-[#FF6A00] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                {day}
              </div>
              {event && (
                <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${event.color}`} title={event.label} />
              )}
            </div>
          );
        })}
      </div>

      {/* Events list */}
      <div className="mt-5 space-y-2">
        {Object.entries(CALENDAR_EVENTS).map(([day, ev]) => (
          <div key={day} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${ev.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{ev.label}</p>
              <p className="text-xs text-gray-400">Marzo {day}, 2026</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-5 w-full py-2.5 rounded-xl bg-[#FF6A00] text-white text-sm font-semibold hover:bg-[#e05e00] transition-colors">
        + Agendar proyecto
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <form
              onSubmit={(e) => { e.preventDefault(); router.push(`/artists?q=${search}`); }}
              className="relative"
            >
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-9 pr-4 py-2 w-72 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00]"
              />
            </form>
            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[#FF6A00] rounded-full" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex gap-8">
            {/* Left: Calendar */}
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">{t('calendarTitle')}</h2>
                <Link href="/bookings" className="text-sm text-[#FF6A00] font-medium hover:underline">
                  {t('calendarViewAll')}
                </Link>
              </div>
              <MiniCalendar />
            </div>

            {/* Right: Nearby Creatives */}
            <div className="w-72 shrink-0 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">{t('nearbyTitle')}</h2>
                {/* Map placeholder */}
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
                    <p className="text-sm font-semibold text-gray-900">{t('nearbyCount', { count: 12 })}</p>
                    <div className="flex -space-x-2 mt-1">
                      {['from-rose-400','from-violet-400','from-teal-400'].map((c,i) => (
                        <div key={i} className={`h-6 w-6 rounded-full bg-gradient-to-br ${c} to-pink-500 border-2 border-white`} />
                      ))}
                    </div>
                  </div>
                  <Link href="/artists" className="text-xs font-semibold text-[#FF6A00] border border-[#FF6A00]/30 rounded-lg px-3 py-1.5 hover:bg-[#FF6A00]/5 transition-colors">
                    {t('gallery')}
                  </Link>
                </div>
              </div>

              {/* Next session */}
              <div className="bg-gray-900 rounded-2xl p-5 text-white">
                <p className="text-xs text-gray-400 mb-1">{t('nextSession')}</p>
                <p className="font-semibold">{t('nextSessionDetails')}</p>
                <p className="text-sm text-gray-400 mt-0.5">{t('nextSessionTime')}</p>
                <div className="h-16 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 mt-3 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <Link href="/bookings" className="mt-3 block text-center text-sm font-medium text-[#FF6A00] hover:underline">
                  {t('details')}
                </Link>
              </div>
            </div>
          </div>

          {/* Recommended for You */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t('recommendedTitle')}</h2>
              <Link href="/artists" className="text-sm text-[#FF6A00] font-medium hover:underline">{t('recommendedViewAll')}</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {RECOMMENDED.map(artist => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={`h-32 bg-gradient-to-br ${artist.color} relative`}>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <svg className="h-3 w-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-800">{artist.rating}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{artist.name}</p>
                    <p className="text-xs text-gray-400">{artist.category}</p>
                    <p className="text-sm font-bold text-[#FF6A00] mt-1">{t('fromPrice', { price: artist.price })}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function CalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
