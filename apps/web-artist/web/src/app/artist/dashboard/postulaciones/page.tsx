'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk } from '@piums/sdk';
import type { ArtistPosting, PostingApplication } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, ChevronDown, ChevronUp, Users, Calendar, DollarSign,
  CheckCircle, XCircle, Clock, Eye, Trash2, ExternalLink, X, Link2,
  MessageSquare, Send
} from 'lucide-react';

const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://client.piums.io';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
  FILLED: 'Cubierta',
  CANCELLED: 'Cancelada',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  FILLED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-600',
};
const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  REVIEWED: 'Revisada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Retirada',
};
const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const ROLES = ['Guitarrista', 'Bajista', 'Baterista', 'Tecladista', 'Violinista', 'Saxofonista', 'DJ', 'Cantante', 'Fotógrafo', 'Videógrafo', 'Sonidista', 'MC / Animador', 'Otro'];

type ApplicationEnriched = PostingApplication & { artistName?: string; artistAvatar?: string; artistCategory?: string };
type PostingWithApps = ArtistPosting & { applications: ApplicationEnriched[] };

// ── Application detail / review modal ──────────────────────────────────────
function ApplicationDetailModal({
  app,
  postingIsOpen,
  onClose,
  onRespond,
}: {
  app: ApplicationEnriched;
  postingIsOpen: boolean;
  onClose: () => void;
  onRespond: (appId: string, accept: boolean) => Promise<void>;
}) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const handle = async (accept: boolean) => {
    setLoading(accept ? 'accept' : 'reject');
    try {
      await onRespond(app.id, accept);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  const isActionable = postingIsOpen && (app.status === 'PENDING' || app.status === 'REVIEWED');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Revisar postulación</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Artist identity */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600 shrink-0">
              {(app.artistName ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{app.artistName ?? 'Artista'}</p>
              {app.artistCategory && (
                <p className="text-xs text-gray-500">{app.artistCategory}</p>
              )}
              <a
                href={`${CLIENT_APP_URL}/artists/${app.artistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#FF6B35] font-medium hover:underline mt-0.5"
              >
                <ExternalLink size={11} />
                Ver perfil público
              </a>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${APP_STATUS_COLORS[app.status]}`}>
              {APP_STATUS_LABELS[app.status]}
            </span>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mensaje</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.message}</p>
          </div>

          {/* Portfolio links */}
          {app.portfolioLinks && app.portfolioLinks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Portfolio</p>
              <ul className="space-y-1">
                {app.portfolioLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#FF6B35] hover:underline break-all"
                    >
                      <Link2 size={11} className="shrink-0" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Aplicó el {new Date(app.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        {isActionable ? (
          <div className="px-5 pb-5 flex gap-3">
            <button
              disabled={!!loading}
              onClick={() => handle(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {loading === 'reject' ? 'Rechazando...' : 'Rechazar'}
            </button>
            <button
              disabled={!!loading}
              onClick={() => handle(true)}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading === 'accept' ? 'Aceptando...' : 'Aceptar artista'}
            </button>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Posting card ────────────────────────────────────────────────────────────
function PostingCard({
  posting,
  onClose,
  onDelete,
  onApplicationRespond,
}: {
  posting: PostingWithApps;
  onClose: (id: string, status: 'CLOSED' | 'CANCELLED') => void;
  onDelete: (id: string) => void;
  onApplicationRespond: (appId: string, accept: boolean) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationEnriched | null>(null);

  const openApp = async (app: ApplicationEnriched) => {
    setSelectedApp(app);
    // Mark as reviewed if still PENDING (fire-and-forget)
    if (app.status === 'PENDING') {
      sdk.markApplicationReviewed(app.id).catch(() => {});
    }
  };

  const pendingCount = posting.applications.filter(a => a.status === 'PENDING').length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          postingIsOpen={posting.status === 'OPEN'}
          onClose={() => setSelectedApp(null)}
          onRespond={async (appId, accept) => {
            await onApplicationRespond(appId, accept);
            setSelectedApp(null);
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[posting.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[posting.status] ?? posting.status}
              </span>
              <span className="text-xs text-gray-500 font-medium">{posting.role}</span>
              {pendingCount > 0 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Clock size={11} /> {pendingCount} nueva{pendingCount !== 1 ? 's' : ''}
                </span>
              )}
              {posting.applicationCount > 0 && (
                <span className="text-xs text-purple-600 font-medium flex items-center gap-0.5">
                  <Users size={11} /> {posting.applicationCount} total
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{posting.title}</p>
            {posting.eventDate && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(posting.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
            {(posting.budgetMin || posting.budgetMax) && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <DollarSign size={11} />
                {posting.budgetMin && posting.budgetMax
                  ? `Q${(posting.budgetMin / 100).toLocaleString()} – Q${(posting.budgetMax / 100).toLocaleString()}`
                  : posting.budgetMin
                  ? `Desde Q${(posting.budgetMin / 100).toLocaleString()}`
                  : `Hasta Q${(posting.budgetMax! / 100).toLocaleString()}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {posting.status === 'OPEN' && (
              <button
                onClick={() => onClose(posting.id, 'CLOSED')}
                title="Cerrar postulación"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
              >
                <X size={15} />
              </button>
            )}
            <button
              onClick={() => onDelete(posting.id)}
              title="Eliminar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={15} />
            </button>
            {posting.applications.length > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
              >
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && posting.applications.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {posting.applications.map(app => (
            <button
              key={app.id}
              onClick={() => openApp(app)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition text-left"
            >
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 text-xs font-bold text-purple-600">
                {(app.artistName ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{app.artistName ?? 'Artista'}</span>
                  {app.artistCategory && <span className="text-xs text-gray-400">{app.artistCategory}</span>}
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${APP_STATUS_COLORS[app.status]}`}>
                    {APP_STATUS_LABELS[app.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{app.message}</p>
                {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                  <p className="text-xs text-[#FF6B35] mt-0.5 flex items-center gap-0.5">
                    <Link2 size={10} /> {app.portfolioLinks.length} link{app.portfolioLinks.length !== 1 ? 's' : ''} de portfolio
                  </p>
                )}
              </div>
              <Eye size={14} className="shrink-0 text-gray-300 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePostingModal({ onClose, onCreate }: { onClose: () => void; onCreate: (posting: ArtistPosting) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    role: '',
    customRole: '',
    category: '',
    eventDate: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomRole = form.role === 'Otro';
  const finalRole = isCustomRole ? form.customRole : form.role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !finalRole.trim() || !form.description.trim()) {
      setError('Completa los campos requeridos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { posting } = await sdk.createPosting({
        title: form.title.trim(),
        description: form.description.trim(),
        role: finalRole.trim(),
        category: form.category || undefined,
        eventDate: form.eventDate || undefined,
        budgetMin: form.budgetMin ? Math.round(parseFloat(form.budgetMin) * 100) : undefined,
        budgetMax: form.budgetMax ? Math.round(parseFloat(form.budgetMax) * 100) : undefined,
      });
      onCreate(posting);
    } catch (err: any) {
      setError(err.message || 'Error creando postulación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Nueva postulación</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Busco guitarrista para evento corporativo"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rol buscado *</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            >
              <option value="">Selecciona un rol</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {isCustomRole && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Especifica el rol *</label>
              <input
                value={form.customRole}
                onChange={e => setForm(f => ({ ...f, customRole: e.target.value }))}
                placeholder="Ej: Arpa, Acordeonista..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe el evento, estilo musical requerido, horario, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha del evento</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Ej: Rock, Jazz, Pop"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presupuesto mín. (Q)</label>
              <input
                type="number"
                min="0"
                value={form.budgetMin}
                onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presupuesto máx. (Q)</label>
              <input
                type="number"
                min="0"
                value={form.budgetMax}
                onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold hover:bg-[#e55a28] disabled:opacity-50 transition"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostulacionesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [postings, setPostings] = useState<PostingWithApps[]>([]);
  const [myApplications, setMyApplications] = useState<(PostingApplication & { posting?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'applied' | 'board'>('mine');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchMyPostings = useCallback(async () => {
    try {
      setLoading(true);
      const [postingsRes, myAppsRes] = await Promise.all([
        sdk.getMyPostings(),   // applications already enriched server-side
        sdk.getMyApplications(),
      ]);
      // Applications come pre-enriched from getMyPostings — no extra requests needed
      setPostings((postingsRes.postings ?? []) as PostingWithApps[]);
      setMyApplications(myAppsRes.applications ?? []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMyPostings();
  }, [isAuthenticated, fetchMyPostings]);

  const handleClose = async (id: string, status: 'CLOSED' | 'CANCELLED') => {
    try {
      await sdk.updatePosting(id, { status });
      setPostings(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err: any) {
      alert(err.message || 'Error cerrando postulación');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta postulación? Esta acción no se puede deshacer.')) return;
    try {
      await sdk.deletePosting(id);
      setPostings(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error eliminando postulación');
    }
  };

  const handleApplicationRespond = async (appId: string, accept: boolean) => {
    const { application } = await sdk.respondToApplication(appId, accept);
    await fetchMyPostings();
    if (accept && (application as any).chatGroupId) {
      router.push(`/chat/grupo?groupId=${(application as any).chatGroupId}`);
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (!confirm('¿Retirar esta aplicación?')) return;
    setWithdrawingId(appId);
    try {
      await sdk.withdrawApplication(appId);
      await fetchMyPostings();
    } catch (err: any) {
      alert(err.message || 'Error al retirar la aplicación');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      {showCreate && (
        <CreatePostingModal
          onClose={() => setShowCreate(false)}
          onCreate={posting => {
            setPostings(prev => [{ ...posting, applications: [] }, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
      <main className="flex-1 lg:ml-72 p-6 pt-20 lg:pt-6 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Postulaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Publica vacantes o encuentra oportunidades</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e55a28] transition"
          >
            <Plus size={16} />
            Nueva vacante
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mis vacantes
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'applied' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Aplicaciones enviadas
            {myApplications.filter(a => a.status === 'PENDING' || a.status === 'REVIEWED').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {myApplications.filter(a => a.status === 'PENDING' || a.status === 'REVIEWED').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('board'); router.push('/artist/dashboard/postulaciones/tablero'); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tablero de vacantes
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : activeTab === 'applied' ? (
          /* ── Mis aplicaciones enviadas ── */
          myApplications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <Send size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Sin aplicaciones enviadas</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Ve al Tablero de vacantes para encontrar oportunidades</p>
              <button
                onClick={() => router.push('/artist/dashboard/postulaciones/tablero')}
                className="inline-flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e55a28] transition"
              >
                Ver tablero
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map(app => {
                const statusColors: Record<string, string> = {
                  PENDING: 'bg-yellow-100 text-yellow-700',
                  REVIEWED: 'bg-blue-100 text-blue-700',
                  ACCEPTED: 'bg-green-100 text-green-700',
                  REJECTED: 'bg-red-100 text-red-600',
                  WITHDRAWN: 'bg-gray-100 text-gray-500',
                };
                const statusLabels: Record<string, string> = {
                  PENDING: 'Pendiente',
                  REVIEWED: 'Revisada',
                  ACCEPTED: 'Aceptada',
                  REJECTED: 'No seleccionado',
                  WITHDRAWN: 'Retirada',
                };
                const posting = (app as any).posting;
                const chatGroupId = (app as any).chatGroupId;
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {posting?.title ?? 'Vacante'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{posting?.role}</p>
                        {posting?.eventDate && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(posting.eventDate).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[app.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {statusLabels[app.status] ?? app.status}
                      </span>
                    </div>

                    {app.status === 'REVIEWED' && (
                      <p className="mt-2 text-xs text-blue-600 font-medium">El publicador revisó tu perfil</p>
                    )}

                    <div className="mt-3 flex gap-2">
                      {app.status === 'ACCEPTED' && (
                        <button
                          onClick={() => router.push(`/chat/grupo?groupId=${chatGroupId ?? ''}`)}
                          disabled={!chatGroupId}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-40 transition"
                        >
                          <MessageSquare size={13} />
                          Ir al chat de coordinación
                        </button>
                      )}
                      {(app.status === 'PENDING' || app.status === 'REVIEWED') && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
                        >
                          {withdrawingId === app.id ? 'Retirando...' : 'Retirar aplicación'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : postings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Sin vacantes publicadas</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Publica una vacante cuando necesites un músico o colaborador</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e55a28] transition"
            >
              <Plus size={15} />
              Publicar vacante
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {postings.map(p => (
              <PostingCard
                key={p.id}
                posting={p}
                onClose={handleClose}
                onDelete={handleDelete}
                onApplicationRespond={handleApplicationRespond}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
