'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { toast } from '@/lib/toast';

interface Opening {
  id: string;
  role: string;
  description: string | null;
  slots: number;
  createdAt: string;
  _count: { applications: number };
  band: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
    city: string;
    country: string;
  };
}

export default function AuditionsPage() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [messageMap, setMessageMap] = useState<Record<string, string>>({});

  const fetchOpenings = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/bands/openings/all?q=${encodeURIComponent(q)}` : '/api/bands/openings/all';
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setOpenings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchOpenings(); }, [fetchOpenings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchOpenings(query);
  };

  const handleApply = async (openingId: string) => {
    setApplying(openingId);
    try {
      const res = await fetch(`/api/bands/openings/${openingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageMap[openingId] || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || d.message || 'Error al postularse');
      } else {
        toast.success('Postulación enviada');
        setApplied((prev) => new Set([...prev, openingId]));
        setMessageMap((prev) => { const n = { ...prev }; delete n[openingId]; return n; });
      }
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audiciones abiertas</h1>
          <p className="text-sm text-gray-500 mt-1">Bandas que están buscando músicos ahora mismo</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por rol (ej. Baterista, Vocalista...)"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : openings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No hay audiciones abiertas ahora mismo</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {openings.map((o) => (
              <li key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {/* Band avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {o.band.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{o.role}</p>
                        <p className="text-sm text-orange-600 font-medium">{o.band.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{o.band.city}, {o.band.country}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                          {o.slots} cupo{o.slots !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">
                          {o._count.applications} postulante{o._count.applications !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {o.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{o.description}</p>
                    )}

                    {/* Apply section */}
                    {applied.has(o.id) ? (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Postulación enviada
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <textarea
                          placeholder="Mensaje opcional para la banda..."
                          value={messageMap[o.id] ?? ''}
                          onChange={(e) => setMessageMap((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                        <button
                          onClick={() => handleApply(o.id)}
                          disabled={applying === o.id}
                          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                          {applying === o.id ? 'Enviando...' : 'Postularme'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
