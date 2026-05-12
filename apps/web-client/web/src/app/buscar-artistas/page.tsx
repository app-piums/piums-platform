'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cImg } from '@/lib/cloudinaryImg';
import { Map, Marker } from 'pigeon-maps';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import ClientSidebar from '@/components/ClientSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { CurrencyToggle, useCurrency } from '@/contexts/CurrencyContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { sdk } from '@piums/sdk';
import type { Artist } from '@piums/sdk';
import { Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: '',                   label: 'Todas las categorías' },
  { value: 'MUSICO',             label: 'Músico' },
  { value: 'FOTOGRAFO',          label: 'Fotógrafo' },
  { value: 'VIDEOGRAFO',         label: 'Videógrafo' },
  { value: 'ANIMADOR',           label: 'Animador' },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.filter(o => o.value).map(o => [o.value, o.label])
);

const CITY_OPTIONS = [
  { value: '', label: 'Todas las ciudades' },
  { value: 'Ciudad de Guatemala', label: 'Ciudad de Guatemala' },
  { value: 'Antigua Guatemala', label: 'Antigua Guatemala' },
  { value: 'Quetzaltenango', label: 'Quetzaltenango (Xela)' },
  { value: 'Mixco', label: 'Mixco' },
  { value: 'Villa Nueva', label: 'Villa Nueva' },
  { value: 'Escuintla', label: 'Escuintla' },
  { value: 'Chimaltenango', label: 'Chimaltenango' },
  { value: 'Cobán', label: 'Cobán' },
  { value: 'Huehuetenango', label: 'Huehuetenango' },
  { value: 'San Marcos', label: 'San Marcos' },
  { value: 'Puerto Barrios', label: 'Puerto Barrios' },
];

// Synonym map: query terms → category enum values they should match
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'musica':             ['MUSICO'],
  'música':             ['MUSICO'],
  'musico':             ['MUSICO'],
  'músico':             ['MUSICO'],
  'banda':              ['MUSICO'],
  'cantante':           ['MUSICO'],
  'guitarra':           ['MUSICO'],
  'piano':              ['MUSICO'],
  'violín':             ['MUSICO'],
  'mariachi':           ['MUSICO'],
  'marimba':            ['MUSICO'],
  'foto':               ['FOTOGRAFO'],
  'fotograf':           ['FOTOGRAFO'],
  'fotografo':          ['FOTOGRAFO'],
  'fotógrafo':          ['FOTOGRAFO'],
  'video':              ['VIDEOGRAFO'],
  'videograf':          ['VIDEOGRAFO'],
  'videógrafo':         ['VIDEOGRAFO'],
  'payaso':             ['ANIMADOR'],
  'clown':              ['ANIMADOR'],
  'globo':              ['ANIMADOR'],
  'show infantil':      ['ANIMADOR'],
  'maestro':            ['ANIMADOR'],
  'ceremonia':          ['ANIMADOR'],
  'animador':           ['ANIMADOR'],
  'mc':                 ['ANIMADOR'],
  'boda':               ['ANIMADOR'],
  'quinceañera':        ['ANIMADOR'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ArtistWithMeta extends Artist {
  distance: number | null;
  available: boolean;
  baseLocationLat?: number;
  baseLocationLng?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES = ['L','M','M','J','V','S','D'];
const DEFAULT_CENTER: [number, number] = [14.6349, -90.5069]; // Guatemala City

// Approximate center coordinates for common Guatemalan cities (used when artist has no exact coords)
const CITY_COORDS: Record<string, [number, number]> = {
  'ciudad de guatemala':  [14.6349, -90.5069],
  'guatemala':            [14.6349, -90.5069],
  'ciudad guatemala':     [14.6349, -90.5069],
  'zona 1':               [14.6408, -90.5133],
  'zona 10':              [14.6043, -90.5070],
  'zona 14':              [14.5830, -90.5041],
  'antigua guatemala':    [14.5586, -90.7295],
  'antigua':              [14.5586, -90.7295],
  'quetzaltenango':       [14.8444, -91.5155],
  'xela':                 [14.8444, -91.5155],
  'escuintla':            [14.3009, -90.7860],
  'mixco':                [14.6307, -90.5966],
  'villa nueva':          [14.5269, -90.5880],
  'san jose pinula':      [14.5432, -90.4113],
  'chinautla':            [14.7226, -90.4839],
  'san pedro ayampuc':    [14.7948, -90.4386],
  'amatitlan':            [14.4779, -90.6218],
  'chimaltenango':        [14.6583, -90.8194],
  'huehuetenango':        [15.3197, -91.4728],
  'san marcos':           [14.9643, -91.7964],
  'retalhuleu':           [14.5353, -91.6861],
  'coban':                [15.4659, -90.3791],
  'alta verapaz':         [15.4659, -90.3791],
  'peten':                [16.9144, -89.8873],
  'flores':               [16.9144, -89.8873],
  'jalapa':               [14.6297, -89.9897],
  'chiquimula':           [14.7992, -89.5453],
  'zacapa':               [14.9714, -89.5256],
  'izabal':               [15.7411, -89.1512],
  'puerto barrios':       [15.7291, -88.5910],
  'livingston':           [15.8280, -88.7462],
};

function getImpliedCategories(query: string): string[] {
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const implied = new Set<string>();
  for (const [term, cats] of Object.entries(CATEGORY_SYNONYMS)) {
    const normTerm = term.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (q.includes(normTerm)) cats.forEach(c => implied.add(c));
  }
  return Array.from(implied);
}

function getCityCoords(cityName?: string | null): [number, number] | null {
  if (!cityName) return null;
  const key = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const normCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key.includes(normCity) || normCity.includes(key)) return coords;
  }
  return null;
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number | null): string {
  if (km === null) return 'Distancia desconocida';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Calendar Component
// ─────────────────────────────────────────────────────────────────────────────
interface CalendarSelectorProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

function CalendarSelector({ selectedDate, onSelectDate }: CalendarSelectorProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold text-gray-800">{MONTHS[month]} {year}</h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateStr = toDateString(year, month, day);
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const isSelected = selectedDate === dateStr;

          return (
            <div key={i} className="flex justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => !isPast && onSelectDate(dateStr)}
                className={[
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#FF6B35] text-white shadow-md shadow-orange-200 scale-110'
                    : isToday
                    ? 'border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-[#FF6B35] cursor-pointer',
                ].join(' ')}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Artist Result Card
const CATEGORY_GRADIENTS_BS: Record<string, [string, string]> = {
  MUSICO:     ['#FF6B35', '#F59E0B'],
  DJ:         ['#FF6B35', '#C026D3'],
  FOTOGRAFO:  ['#F59E0B', '#1D4ED8'],
  VIDEOGRAFO: ['#4F46E5', '#C026D3'],
  DISENADOR:  ['#F59E0B', '#10B981'],
  BAILARIN:   ['#FF6B35', '#EF4444'],
  ANIMADOR:   ['#F59E0B', '#FF6B35'],
  TATUADOR:   ['#1E1B4B', '#7C3AED'],
  MAQUILLADOR:['#EC4899', '#9D174D'],
  PINTOR:     ['#0891B2', '#059669'],
  ESCULTOR:   ['#475569', '#1E293B'],
  ESCRITOR:   ['#4F46E5', '#F59E0B'],
  MAGO:       ['#7C3AED', '#4F46E5'],
  ACROBATA:   ['#FF6B35', '#F59E0B'],
};
function bsCoverGradient(category?: string): string {
  const [a, b] = CATEGORY_GRADIENTS_BS[category ?? ''] ?? ['#FF6B35', '#F59E0B'];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

const isNewArtist = (a: { createdAt?: string }) =>
  !!a.createdAt && new Date(a.createdAt) >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
function ArtistResultCard({
  artist,
  selectedDate,
  matchedServicePrice,
}: {
  artist: ArtistWithMeta;
  selectedDate: string;
  matchedServicePrice?: { name: string; price: number; currency: string };
}) {
  const { formatPrice } = useCurrency();
  const href = `/artists/${artist.slug || artist.id}`;
  const bookHref = `/booking?artistId=${artist.id}&date=${selectedDate}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative h-36 overflow-hidden" style={{ background: bsCoverGradient(artist.category) }}>
        {!artist.coverPhoto && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white font-black" style={{ fontSize: '6rem', lineHeight: 1, opacity: 0.12 }}>
                {(artist.nombre?.[0] ?? '?').toUpperCase()}
              </span>
            </div>
          </>
        )}
        {artist.coverPhoto && (
          <img
            src={cImg(artist.coverPhoto)}
            alt={artist.nombre}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Availability badge */}
        <div className="absolute top-2.5 right-2.5">
          {artist.available ? (
            <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              Disponible
            </span>
          ) : (
            <span className="bg-gray-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
              Ocupado
            </span>
          )}
        </div>
        {/* Verified badge — top left */}
        {artist.isVerified && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-[#FF6B35] text-white text-xs font-semibold px-2 py-1 rounded-full shadow flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verificado
            </span>
          </div>
        )}
        {/* Nuevo badge — shown when not verified (would overlap), stacked below or first if not verified */}
        {!artist.isVerified && isNewArtist(artist as any) && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-amber-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow flex items-center gap-1">
              <Sparkles size={11} />
              Nuevo
            </span>
          </div>
        )}
        {artist.isVerified && isNewArtist(artist as any) && (
          <div className="absolute top-9 left-2.5">
            <span className="bg-amber-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow flex items-center gap-1">
              <Sparkles size={11} />
              Nuevo
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
            {artist.avatar || artist.imagenPerfil ? (
              <img
                src={cImg(artist.avatar || artist.imagenPerfil)}
                alt={artist.nombre}
                className="object-cover w-full h-full"
              />
            ) : (
              artist.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={href} className="font-semibold text-gray-900 text-sm hover:text-[#FF6B35] transition-colors truncate block">
              {artist.nombre}
            </Link>
            <p className="text-xs text-gray-500 truncate">{CATEGORY_LABEL[artist.category ?? ''] || CATEGORY_LABEL[artist.categoria ?? ''] || 'Artista'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {artist.rating && (
            <span className="flex items-center gap-0.5">
              <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {artist.rating.toFixed(1)}
            </span>
          )}
          {/* Distance */}
          <span className="flex items-center gap-0.5 text-[#FF6B35] font-medium">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {formatDistance(artist.distance)}
          </span>
          {((artist as any).city || artist.ciudad) && (
            <span className="truncate">{(artist as any).city || artist.ciudad}</span>
          )}
        </div>

        {/* Price — matched service (smart search) > main service (fetched) > precioDesde */}
        {(() => {
          const price = matchedServicePrice ?? (
            (artist.mainServicePrice != null && artist.mainServicePrice > 0)
              ? { name: (artist.mainServiceName as string | undefined) ?? 'Servicio principal', price: artist.mainServicePrice, currency: 'USD' }
              : (artist.precioDesde != null && artist.precioDesde > 0)
              ? { name: 'Servicio principal', price: artist.precioDesde, currency: 'USD' }
              : null
          );
          if (!price) return null;
          return (
            <div className="flex items-center justify-between gap-2 bg-orange-50 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-gray-500 truncate">{price.name}</span>
              <span className="text-xs font-bold text-[#FF6B35] shrink-0">
                {formatPrice(price.price)}
              </span>
            </div>
          );
        })()}

        {/* Bio snippet */}
        {artist.bio && (
          <p className="text-xs text-gray-500 line-clamp-2">{artist.bio}</p>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2 flex gap-2">
          <Link
            href={href}
            className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ver perfil
          </Link>
          {artist.available && (
            <Link
              href={bookHref}
              className="flex-1 text-center py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-semibold hover:bg-[#e05e00] transition-colors"
            >
              Reservar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon helpers (inline SVG, avoids extra imports)
// ─────────────────────────────────────────────────────────────────────────────
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
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
            fill={star <= active ? '#F59E0B' : 'none'}
            stroke={star <= active ? '#F59E0B' : '#D1D5DB'}
            strokeWidth={1.2}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main content (wrapped to use useSearchParams inside Suspense)
// ─────────────────────────────────────────────────────────────────────────────
function BuscarArtistasContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(params.get('date'));
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [artists, setArtists] = useState<ArtistWithMeta[]>([]);
  const artistsRef = React.useRef<ArtistWithMeta[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [smartPriceMap, setSmartPriceMap] = useState<Record<string, { name: string; price: number; currency: string }>>({});
  const [smartArtists, setSmartArtists] = useState<ArtistWithMeta[]>([]);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'price_low' | 'price_high'>('relevance');
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [citySearchFilter, setCitySearchFilter] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);


  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  // ── Debounced smart-search: builds price map AND ordered artist list ────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSmartPriceMap({});
      setSmartArtists([]);
      return;
    }
    setSmartSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await sdk.smartSearch({ q: searchQuery, limit: 40 });
        const map: Record<string, { name: string; price: number; currency: string }> = {};
        const smartList: ArtistWithMeta[] = [];
        for (const a of results.artists) {
          if (a.matchedService && a.id) {
            map[a.id] = {
              name: a.matchedService.name,
              price: a.matchedService.price,
              currency: a.matchedService.currency,
            };
          }
          smartList.push({
            ...a,
            distance: null,
            available: (a as any).isAvailable ?? (a as any).available ?? true,
          } as ArtistWithMeta);
        }
        // Enrich smart results with calendar/distance data already loaded for the selected date
        const byId = new Map(artistsRef.current.map(p => [p.id, p]));
        setSmartArtists(smartList.map(sa => byId.get(sa.id) ?? sa));
        setSmartPriceMap(map);
      } catch { /* ignore */ }
      finally { setSmartSearchLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Load available artists when date changes ──────────────────────────────
  const loadArtists = useCallback(async (dateStr: string, loc: { lat: number; lng: number } | null) => {
    setLoadingArtists(true);
    try {
      const [yearStr, monthStr] = dateStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1–12

      const res = await sdk.searchArtists({ limit: 40 });
      const rawArtists = res.artists ?? [];

      // Batch-check calendars + services in parallel
      const [calendarResults, serviceResults] = await Promise.all([
        Promise.allSettled(rawArtists.map(a => sdk.getCalendar(a.id, year, month))),
        Promise.allSettled(rawArtists.map(a => sdk.getArtistServices(a.id))),
      ]);

      const enriched: ArtistWithMeta[] = rawArtists.map((a, idx) => {
        const artistAny = a as Artist & { baseLocationLat?: number; baseLocationLng?: number };
        const artistLat = artistAny.baseLocationLat ?? null;
        const artistLng = artistAny.baseLocationLng ?? null;

        // Availability
        let available = true;
        const calRes = calendarResults[idx];
        if (calRes.status === 'fulfilled') {
          const { occupiedDates, blockedDates } = calRes.value;
          available = !occupiedDates.includes(dateStr) && !blockedDates.includes(dateStr);
        }

        // Main service price
        let mainServicePrice: number | undefined;
        let mainServiceName: string | undefined;
        const svcRes = serviceResults[idx];
        if (svcRes.status === 'fulfilled' && svcRes.value.length > 0) {
          const main = svcRes.value.find(s => (s as any).isMainService) ?? svcRes.value[0];
          mainServicePrice = main.basePrice / 100; // convert cents → display units (USD)
          mainServiceName = main.name;
        }

        // Distance — use exact coords if available, fall back to city-center coords
        let distance: number | null = null;
        if (loc) {
          const latToUse = artistLat ?? (getCityCoords((a as any).city || a.ciudad)?.[0] ?? null);
          const lngToUse = artistLng ?? (getCityCoords((a as any).city || a.ciudad)?.[1] ?? null);
          if (latToUse !== null && lngToUse !== null) {
            distance = haversineKm(loc.lat, loc.lng, latToUse, lngToUse);
          }
        }

        return {
          ...a,
          baseLocationLat: artistLat ?? undefined,
          baseLocationLng: artistLng ?? undefined,
          available,
          distance,
          mainServicePrice: mainServicePrice ?? a.mainServicePrice,
          mainServiceName: mainServiceName ?? a.mainServiceName,
        };
      });

      // Sort: available first, then by distance asc (nulls last)
      enriched.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });

      artistsRef.current = enriched;
      setArtists(enriched);
    } catch (err) {
      console.error('Error loading artists:', err);
    } finally {
      setLoadingArtists(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) loadArtists(selectedDate, location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Re-sort when location changes (no extra API call needed)
  useEffect(() => {
    if (!location || artists.length === 0) return;
    setArtists(prev => {
      const updated = prev.map(a => {
        const exactLat = a.baseLocationLat;
        const exactLng = a.baseLocationLng;
        const latToUse = exactLat !== undefined ? exactLat : (getCityCoords((a as any).city || a.ciudad)?.[0] ?? null);
        const lngToUse = exactLng !== undefined ? exactLng : (getCityCoords((a as any).city || a.ciudad)?.[1] ?? null);
        return {
          ...a,
          distance:
            latToUse !== null && lngToUse !== null
              ? haversineKm(location.lat, location.lng, latToUse as number, lngToUse as number)
              : null,
        };
      });
      updated.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });
      artistsRef.current = updated;
      return updated;
    });
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Geolocation ───────────────────────────────────────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingMe(false);
      },
      () => setLocatingMe(false),
      { maximumAge: 30000, timeout: 8000 }
    );
  };

  // ── Filtered artists ──────────────────────────────────────────────────────
  // When search is active, use smartSearch results (correct service matching).
  // Fall back to client-side filter only while smartSearch is still loading.
  const activeFilterCount = [minRating > 0, minPrice !== '', maxPrice !== '', citySearchFilter !== '', showVerifiedOnly, showNewOnly].filter(Boolean).length;

  const displayed = (() => {
    const useSmartResults = searchQuery.trim() && smartArtists.length > 0;
    const base = useSmartResults ? smartArtists : artists;

    // Infer category from query synonyms \u2014 applied to smart results too, fixing cross-category bleed
    const impliedCats = searchQuery.trim() && !categoryFilter ? getImpliedCategories(searchQuery) : [];

    let filtered = base.filter(a => {
      if (showOnlyAvailable && !a.available) return false;

      const cat = (a.category || a.categoria || '').toUpperCase();
      if (categoryFilter) {
        if (cat !== categoryFilter.toUpperCase()) return false;
      } else if (impliedCats.length > 0) {
        if (!impliedCats.includes(cat)) return false;
      }

      if (showVerifiedOnly) {
        const verified = (a as any).verificationStatus === 'VERIFIED' || a.isVerified === true;
        if (!verified) return false;
      }
      if (showNewOnly && !isNewArtist(a as any)) return false;
      if (minRating > 0 && (a.rating ?? 0) < minRating) return false;

      const artistPrice = (a as any).mainServicePrice ?? a.precioDesde ?? null;
      if (minPrice && artistPrice !== null && artistPrice < parseFloat(minPrice)) return false;
      if (maxPrice && artistPrice !== null && artistPrice > parseFloat(maxPrice)) return false;

      if (citySearchFilter) {
        const artistCity = ((a as any).city || a.ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const fCity = citySearchFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!artistCity.includes(fCity)) return false;
      }

      // Client-side text filter only as fallback while smartSearch hasn't returned yet
      if (searchQuery.trim() && !useSmartResults) {
        const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const name = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const bio = (a.bio || (a as any).descripcion || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const city = ((a as any).city || a.ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const catLabel = (CATEGORY_LABEL[cat] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const specialties = ((a as any).specialties as string[] || []).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const synonymMatched = Object.entries(CATEGORY_SYNONYMS).some(([term, cats]) =>
          q.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) && cats.includes(cat)
        );
        if (!name.includes(q) && !bio.includes(q) && !city.includes(q) && !catLabel.includes(q) && !specialties.includes(q) && !synonymMatched) return false;
      }
      return true;
    });

    if (sortBy !== 'relevance') {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        const pa = (a as any).mainServicePrice ?? a.precioDesde ?? (sortBy === 'price_low' ? Infinity : 0);
        const pb = (b as any).mainServicePrice ?? b.precioDesde ?? (sortBy === 'price_low' ? Infinity : 0);
        return sortBy === 'price_low' ? pa - pb : pb - pa;
      });
    }

    return filtered;
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const displayName = user?.nombre ?? 'Usuario';
  const mapCenter: [number, number] = location
    ? [location.lat, location.lng]
    : DEFAULT_CENTER;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={displayName} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buscar Artistas</h1>
            <p className="text-sm text-gray-400">Selecciona fecha y ubicación para encontrar artistas disponibles</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CurrencyToggle />
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile title */}
          <div className="lg:hidden mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Buscar Artistas</h1>
              <p className="text-sm text-gray-400 mt-0.5">Selecciona fecha y ubicación</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <CurrencyToggle />
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">

            {/* ── LEFT COLUMN: Calendar + Map ─────────────────────────────── */}
            <div className="xl:w-96 shrink-0 space-y-5">

              {/* Step 1: Date */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedDate ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    1
                  </div>
                  <h2 className="font-semibold text-gray-900">Selecciona la fecha</h2>
                  {selectedDate && (
                    <button
                      onClick={() => { setSelectedDate(null); setArtists([]); }}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <CalendarSelector
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                {selectedDate && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-xl flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-medium text-[#FF6B35] capitalize">{formatDate(selectedDate)}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Location (shown after date is selected) */}
              {selectedDate && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${location ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      2
                    </div>
                    <h2 className="font-semibold text-gray-900">Ubicación del evento</h2>
                    {location && (
                      <button
                        onClick={() => setLocation(null)}
                        className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Haz clic en el mapa o usa tu ubicación actual para ordenar artistas por distancia.
                  </p>

                  {/* Use my location button */}
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locatingMe}
                    className="w-full mb-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {locatingMe ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {locatingMe ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
                  </button>

                  {/* Map */}
                  <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                    <Map
                      defaultCenter={mapCenter}
                      center={mapCenter}
                      defaultZoom={11}
                      minZoom={5}
                      maxZoom={18}
                      onClick={({ latLng }) => {
                        const [lat, lng] = latLng;
                        setLocation({ lat, lng });
                      }}
                      attributionPrefix={false}
                    >
                      {location && (
                        <Marker anchor={[location.lat, location.lng]} width={40} color="#FF6B35" />
                      )}
                    </Map>
                  </div>

                  {location && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-xl flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs text-[#FF6B35] font-medium">
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Artists ────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Placeholder when no date selected */}
              {!selectedDate && (
                <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-h-64">
                  <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Selecciona una fecha</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Elige el día de tu evento en el calendario para descubrir artistas disponibles cerca de ti.
                  </p>
                </div>
              )}

              {/* Results section */}
              {selectedDate && (
                <>
                  {/* Results header + filters */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    {/* Search bar — full width, prominent */}
                    <div className="relative mb-3">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Busca por nombre, estilo o especialidad…"
                        className="w-full pl-12 pr-10 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                          aria-label="Limpiar búsqueda"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Controls row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Count */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">
                          {loadingArtists ? (
                            <span className="text-gray-400">Buscando artistas…</span>
                          ) : (
                            <><span className="text-[#FF6B35]">{displayed.length}</span> {displayed.length !== 1 ? 'artistas encontrados' : 'artista encontrado'}</>
                          )}
                        </p>
                        {!location && !loadingArtists && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Agrega ubicación para ordenar por distancia</p>
                        )}
                      </div>

                      {/* Category */}
                      <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>

                      {/* Sort */}
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                      >
                        <option value="relevance">Relevancia</option>
                        <option value="rating">Mejor valorados</option>
                        <option value="price_low">Precio: menor a mayor</option>
                        <option value="price_high">Precio: mayor a menor</option>
                      </select>

                      {/* Available toggle */}
                      <button
                        onClick={() => setShowOnlyAvailable(v => !v)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium flex items-center gap-1.5 ${
                          showOnlyAvailable
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${showOnlyAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {showOnlyAvailable ? 'Disponibles' : 'Todos'}
                      </button>

                      {/* Advanced filters */}
                      <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`relative text-xs px-3 py-2 rounded-lg border transition-colors font-medium flex items-center gap-1.5 ${
                          showFilters || activeFilterCount > 0
                            ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-sm shadow-orange-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                        }`}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Filtros
                        {activeFilterCount > 0 && (
                          <span className="ml-0.5 h-4 w-4 rounded-full bg-white text-[#FF6B35] text-[10px] font-bold flex items-center justify-center">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Expanded filter panel */}
                    {showFilters && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* City */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ciudad</label>
                            <select
                              value={citySearchFilter}
                              onChange={e => setCitySearchFilter(e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                            >
                              {CITY_OPTIONS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Rating */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Calificación mínima</label>
                            <StarRatingFilter value={minRating} onChange={setMinRating} />
                          </div>

                          {/* Price range */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Precio (USD)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                placeholder="Mín"
                                min={0}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                              />
                              <span className="text-gray-300 font-medium shrink-0">—</span>
                              <input
                                type="number"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                placeholder="Máx"
                                min={0}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition"
                              />
                            </div>
                          </div>

                          {/* Verified */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Verificación</label>
                            <button
                              onClick={() => setShowVerifiedOnly(v => !v)}
                              className={`w-full text-sm py-2.5 rounded-xl border transition-all font-semibold flex items-center gap-2 justify-center ${
                                showVerifiedOnly
                                  ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-sm shadow-orange-200'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                              }`}
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Solo verificados
                            </button>
                          </div>

                          {/* New artists */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ingreso reciente</label>
                            <button
                              onClick={() => setShowNewOnly(v => !v)}
                              className={`w-full text-sm py-2.5 rounded-xl border transition-all font-semibold flex items-center gap-2 justify-center ${
                                showNewOnly
                                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'
                              }`}
                            >
                              <Sparkles size={15} />
                              Nuevos (60 días)
                            </button>
                          </div>
                        </div>

                        {activeFilterCount > 0 && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => { setMinRating(0); setMinPrice(''); setMaxPrice(''); setCitySearchFilter(''); setShowVerifiedOnly(false); setShowNewOnly(false); }}
                              className="text-xs text-gray-400 hover:text-[#FF6B35] transition-colors font-medium"
                            >
                              Limpiar filtros avanzados
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Loading skeleton */}
                  {(loadingArtists || smartSearchLoading) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                          <div className="h-36 bg-gray-200" />
                          <div className="p-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!loadingArtists && displayed.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                      <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                        <svg className="h-7 w-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-700 mb-1">Sin resultados</h3>
                      <p className="text-sm text-gray-400">
                        {showOnlyAvailable
                          ? 'No hay artistas disponibles para esa fecha. Intenta con otra fecha o desactiva el filtro.'
                          : 'No hay artistas que coincidan con los filtros seleccionados.'}
                      </p>
                      {showOnlyAvailable && (
                        <button
                          onClick={() => setShowOnlyAvailable(false)}
                          className="mt-3 text-sm text-[#FF6B35] font-medium hover:underline"
                        >
                          Ver todos los artistas
                        </button>
                      )}
                    </div>
                  )}

                  {/* Artists grid */}
                  {!loadingArtists && displayed.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayed.map(artist => (
                        <ArtistResultCard
                          key={artist.id}
                          artist={artist}
                          selectedDate={selectedDate}
                          matchedServicePrice={smartPriceMap[artist.id]}
                        />
                      ))}
                    </div>
                  )}

                  {/* Location hint below results */}
                  {!loadingArtists && !location && displayed.length > 0 && (
                    <div className="mt-5 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                      <svg className="h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-600">
                        <strong>Tip:</strong> Selecciona tu ubicación en el mapa para ordenar estos artistas de más cercano a más lejano.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export (Suspense required for useSearchParams)
// ─────────────────────────────────────────────────────────────────────────────
export default function BuscarArtistasPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <BuscarArtistasContent />
    </Suspense>
  );
}
