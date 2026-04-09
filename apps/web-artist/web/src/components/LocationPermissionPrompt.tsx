'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type GeoMode = 'once' | 'while_in_use' | 'always';

interface LocationPermissionPromptProps {
  onCountryDetected: (countryCode: string) => void;
  onDismiss?: () => void;
}

const MODE_KEY = 'piums_geo_mode';
const DISMISSED_KEY = 'piums_geo_dismissed';

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000, // 5 min cache
};

async function resolveCountryCode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.countryCode === 'string' ? (data.countryCode as string) : null;
  } catch {
    return null;
  }
}

export function LocationPermissionPrompt({
  onCountryDetected,
  onDismiss,
}: LocationPermissionPromptProps) {
  const [showModal, setShowModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const watchRef = useRef<number | null>(null);

  const stopWatch = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation?.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  const startDetection = useCallback(
    (mode: GeoMode) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;
      stopWatch();

      // Show spinner only for once-mode (background watch is silent)
      if (mode === 'once') setDetecting(true);

      const onPosition = async (pos: GeolocationPosition) => {
        const code = await resolveCountryCode(pos.coords.latitude, pos.coords.longitude);
        setDetecting(false);
        if (code) onCountryDetected(code);
      };

      const onError = () => {
        setDetecting(false);
        stopWatch();
      };

      if (mode === 'once') {
        navigator.geolocation.getCurrentPosition(onPosition, onError, GEO_OPTIONS);
      } else {
        // 'while_in_use' | 'always' — watch until component unmounts
        watchRef.current = navigator.geolocation.watchPosition(onPosition, onError, GEO_OPTIONS);
      }
    },
    [onCountryDetected, stopWatch]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMode = localStorage.getItem(MODE_KEY) as GeoMode | null;
    const dismissed = localStorage.getItem(DISMISSED_KEY);

    if (savedMode) {
      // Auto-apply stored preference silently (no modal)
      startDetection(savedMode);
    } else if (!dismissed) {
      setShowModal(true);
    }

    return stopWatch;
  }, [startDetection, stopWatch]);

  const choose = (mode: GeoMode) => {
    localStorage.setItem(MODE_KEY, mode);
    setShowModal(false);
    startDetection(mode);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShowModal(false);
    onDismiss?.();
  };

  if (!showModal && !detecting) return null;

  if (detecting) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 text-sm text-gray-500 max-w-xs">
        <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
        Detectando tu ubicación…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Permitir ubicación</h3>
            <p className="text-xs text-gray-500">Mejora tu experiencia en Piums</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Tu ubicación nos permite actualizar tu visibilidad automáticamente cuando estás trabajando en otro país.
        </p>

        {/* Mode options */}
        <div className="space-y-2 mb-4">
          {(
            [
              {
                mode: 'once' as GeoMode,
                label: 'Solo una vez',
                desc: 'Capturar ahora sin guardar preferencia',
              },
              {
                mode: 'while_in_use' as GeoMode,
                label: 'Mientras uso la app',
                desc: 'Activo mientras tengas la app abierta',
                recommended: true,
              },
              {
                mode: 'always' as GeoMode,
                label: 'Siempre',
                desc: 'Aplicar automáticamente al abrir Piums',
              },
            ] as Array<{ mode: GeoMode; label: string; desc: string; recommended?: boolean }>
          ).map(({ mode, label, desc, recommended }) => (
            <button
              key={mode}
              onClick={() => choose(mode as GeoMode)}
              className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  {recommended && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      Recomendado
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{desc}</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-orange-500 shrink-0 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
