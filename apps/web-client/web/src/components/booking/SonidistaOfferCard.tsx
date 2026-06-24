'use client';

import { useRouter } from 'next/navigation';
import type { SonidistaMatch } from '@piums/sdk';

interface Props {
  matches: SonidistaMatch[];
  loading: boolean;
  date: Date;
  durationMinutes: number;
  onDismiss: () => void;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5 text-yellow-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-3 h-3" fill={i < full ? 'currentColor' : i === full && hasHalf ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function SonidistaOfferCard({ matches, loading, date, durationMinutes, onDismiss }: Props) {
  const router = useRouter();

  const dateStr = date.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateParam = date.toISOString().split('T')[0];

  const handleViewProfile = (artistId: string) => {
    router.push(`/artists/${artistId}?date=${dateParam}&duration=${durationMinutes}`);
  };

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-blue-900">Este artista no cuenta con equipo de sonido propio</h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Para tu evento del {dateStr}, te recomendamos complementar con un sonidista.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 flex-shrink-0 mt-0.5"
          aria-label="Descartar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {loading && (
          <div className="flex gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex-1 h-16 bg-blue-100 animate-pulse rounded-md" />
            ))}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <p className="text-xs text-blue-600">No encontramos sonidistas disponibles para este dia.</p>
        )}

        {!loading && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {matches.slice(0, 3).map((m) => (
              <div key={m.artistId} className="bg-white border border-blue-100 rounded-md p-3 flex items-center gap-2">
                <div className="flex-shrink-0">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.artistName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {m.artistName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{m.artistName}</p>
                  <StarRating rating={m.artistRating} />
                  <p className="text-xs text-gray-500">Q{m.price.toFixed(0)}</p>
                </div>
                <button
                  onClick={() => handleViewProfile(m.artistId)}
                  className="text-xs text-blue-600 font-medium hover:underline whitespace-nowrap"
                >
                  Ver perfil
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && matches.length > 0 && (
          <button
            onClick={onDismiss}
            className="text-xs text-blue-500 hover:text-blue-700 underline mt-1"
          >
            No, gracias
          </button>
        )}
      </div>
    </div>
  );
}
