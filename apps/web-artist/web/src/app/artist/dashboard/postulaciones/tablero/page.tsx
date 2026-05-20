'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk } from '@piums/sdk';
import type { ArtistPosting } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, DollarSign, Users, ChevronLeft, Send, X, Search, AlertCircle, Sparkles } from 'lucide-react';
import type { ArtistProfile } from '@piums/sdk';

const ROLES = ['Guitarrista', 'Bajista', 'Baterista', 'Tecladista', 'Violinista', 'Saxofonista', 'DJ', 'Cantante', 'Fotógrafo', 'Videógrafo', 'Sonidista', 'MC / Animador'];

function ApplyModal({
  posting,
  onClose,
  onApplied,
  onError,
}: {
  posting: ArtistPosting;
  onClose: () => void;
  onApplied: () => void;
  onError?: (msg: string) => void;
}) {
  const [message, setMessage] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Escribe un mensaje'); return; }
    setLoading(true);
    setError(null);
    try {
      const links = portfolioLinks
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      await sdk.applyToPosting(posting.id, { message: message.trim(), portfolioLinks: links });
      onApplied();
    } catch (err: any) {
      const msg = err.message || 'Error enviando aplicación';
      // Limit errors are shown as banner, not inline
      if (msg.includes('Límite') && onError) {
        onError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">Aplicar: {posting.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{posting.role}</p>
          </div>
          <button onClick={onClose} className="p-1.5 ml-3 shrink-0 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mensaje *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Preséntate, explica tu experiencia y por qué eres ideal para este rol..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Links de portfolio <span className="text-gray-400 font-normal">(uno por línea, opcional)</span>
            </label>
            <textarea
              value={portfolioLinks}
              onChange={e => setPortfolioLinks(e.target.value)}
              rows={3}
              placeholder="https://youtube.com/...&#10;https://soundcloud.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold hover:bg-[#e55a28] disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              <Send size={14} />
              {loading ? 'Enviando...' : 'Enviar aplicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostingCard({ posting, myApplicationIds, onApply }: {
  posting: ArtistPosting;
  myApplicationIds: Set<string>;
  onApply: (posting: ArtistPosting) => void;
}) {
  const hasApplied = myApplicationIds.has(posting.id);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">
              {posting.role}
            </span>
            {posting.category && (
              <span className="text-xs text-gray-500">{posting.category}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">{posting.title}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{posting.description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {posting.eventDate && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(posting.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            {(posting.budgetMin || posting.budgetMax) && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign size={11} />
                {posting.budgetMin && posting.budgetMax
                  ? `Q${(posting.budgetMin / 100).toLocaleString()} – Q${(posting.budgetMax / 100).toLocaleString()}`
                  : posting.budgetMin
                  ? `Desde Q${(posting.budgetMin / 100).toLocaleString()}`
                  : `Hasta Q${(posting.budgetMax! / 100).toLocaleString()}`}
              </span>
            )}
            {posting.applicationCount > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users size={11} />
                {posting.applicationCount} aplicaci{posting.applicationCount === 1 ? 'ón' : 'ones'}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {hasApplied ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-100 text-green-700">
              Aplicaste
            </span>
          ) : (
            <button
              onClick={() => onApply(posting)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e55a28] transition"
            >
              Aplicar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile completeness check
function isProfileIncomplete(profile: ArtistProfile | null): boolean {
  if (!profile) return false;
  return !profile.bio || !profile.avatar || !profile.categoria;
}

export default function TableroPostulacionesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [postings, setPostings] = useState<ArtistPosting[]>([]);
  const [myApplicationPostingIds, setMyApplicationPostingIds] = useState<Set<string>>(new Set());
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState<ArtistPosting | null>(null);
  const [appliedDone, setAppliedDone] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [boardRes, myAppsRes, profileRes] = await Promise.all([
        sdk.getPostings({ status: 'OPEN', role: roleFilter || undefined }),
        sdk.getMyApplications(),
        sdk.getArtistProfile().catch(() => null),
      ]);
      const filtered = searchQuery
        ? (boardRes.postings ?? []).filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.role.toLowerCase().includes(searchQuery.toLowerCase()))
        : (boardRes.postings ?? []);
      setPostings(filtered);
      setMyApplicationPostingIds(new Set((myAppsRes.applications ?? []).map(a => a.postingId)));
      if (profileRes) setArtistProfile(profileRes);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const handleApplied = async () => {
    setApplyTarget(null);
    setAppliedDone(true);
    setApplyError(null);
    await fetchData();
    setTimeout(() => setAppliedDone(false), 4000);
  };

  const handleApplyError = (msg: string) => {
    setApplyTarget(null);
    setApplyError(msg);
    setTimeout(() => setApplyError(null), 5000);
  };

  // Filter out own postings from board
  const myArtistId = (user as any)?.id ?? (user as any)?.artistId;
  const visiblePostings = myArtistId
    ? postings.filter(p => p.artistId !== myArtistId)
    : postings;

  // Suggested: postings whose role matches the artist's category (fuzzy)
  const artistCategory = (artistProfile?.categoria ?? '').toLowerCase();
  const suggestedPostings = artistCategory
    ? visiblePostings.filter(p =>
        p.role.toLowerCase().includes(artistCategory) ||
        artistCategory.includes(p.role.toLowerCase()))
    : [];
  const otherPostings = suggestedPostings.length > 0
    ? visiblePostings.filter(p => !suggestedPostings.some(s => s.id === p.id))
    : visiblePostings;

  const profileIncomplete = isProfileIncomplete(artistProfile);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      {applyTarget && (
        <ApplyModal
          posting={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={handleApplied}
          onError={handleApplyError}
        />
      )}
      <main className="flex-1 lg:ml-72 p-6 pt-20 lg:pt-6 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/artist/dashboard/postulaciones')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tablero de vacantes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Encuentra oportunidades de colaboración</p>
          </div>
        </div>

        {/* Incomplete profile banner */}
        {profileIncomplete && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Completa tu perfil para destacar</p>
              <p className="text-xs text-amber-700 mt-0.5">Los artistas con foto, bio y categoría tienen más probabilidades de ser seleccionados.</p>
            </div>
            <button
              onClick={() => router.push('/artist/dashboard/settings')}
              className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline transition"
            >
              Completar
            </button>
          </div>
        )}

        {appliedDone && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
            Aplicación enviada. El artista revisará tu perfil y te contactará si eres seleccionado.
          </div>
        )}

        {applyError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
            {applyError}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-0 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, rol o descripción..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 bg-white"
          >
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando vacantes...</div>
        ) : visiblePostings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Search size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No hay vacantes abiertas en este momento</p>
            <p className="text-xs text-gray-400 mt-1">Vuelve pronto o publica tu propia vacante</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Suggested section */}
            {suggestedPostings.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} className="text-[#FF6B35]" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Para ti</span>
                </div>
                <div className="space-y-2">
                  {suggestedPostings.map(p => (
                    <PostingCard key={p.id} posting={p} myApplicationIds={myApplicationPostingIds} onApply={setApplyTarget} />
                  ))}
                </div>
              </div>
            )}

            {/* All other postings */}
            {otherPostings.length > 0 && (
              <div>
                {suggestedPostings.length > 0 && (
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Todas las vacantes</p>
                )}
                <p className="text-xs text-gray-400 mb-2">{otherPostings.length} vacante{otherPostings.length !== 1 ? 's' : ''}</p>
                <div className="space-y-2">
                  {otherPostings.map(p => (
                    <PostingCard
                      key={p.id}
                      posting={p}
                      myApplicationIds={myApplicationPostingIds}
                      onApply={setApplyTarget}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
