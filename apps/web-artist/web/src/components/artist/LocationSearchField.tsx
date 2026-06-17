'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

// ─── Provider abstraction ────────────────────────────────────────────────────
// Para migrar a Google Places en el futuro:
//   1. Cambiar searchAddresses() para llamar a Places Autocomplete API
//   2. Cambiar reverseGeocode() para llamar a Geocoding API
//   3. El componente y su integración en booking quedan intactos.
// ─────────────────────────────────────────────────────────────────────────────

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
}

async function searchAddresses(query: string): Promise<LocationResult[]> {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=gt&limit=6&addressdetails=0&accept-language=es`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((r) => ({
    address: r.display_name.split(',').slice(0, 3).join(',').trim(),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data: { display_name: string } = await res.json();
    return data.display_name.split(',').slice(0, 3).join(',').trim();
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  coords: { lat: number; lng: number } | null;
  onAddressChange: (address: string) => void;
  onSelect: (result: LocationResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function LocationSearchField({
  value,
  coords,
  onAddressChange,
  onSelect,
  placeholder = 'Buscar dirección o lugar del evento',
  required,
  disabled,
}: Props) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const results = await searchAddresses(q);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onAddressChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (result: LocationResult) => {
    onSelect(result);
    setSuggestions([]);
    setOpen(false);
  };

  const handleClear = () => {
    onAddressChange('');
    setSuggestions([]);
    setOpen(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasCoords = !!coords;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${hasCoords ? 'text-[#FF6B35]' : 'text-gray-400'}`}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-500 caret-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {hasCoords && (
        <p className="text-xs text-[#FF6B35] mt-1">
          Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-orange-50 flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{s.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
