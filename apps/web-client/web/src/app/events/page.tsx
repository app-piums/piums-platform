'use client';

import React, { useState, useEffect } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { Loading } from '@/components/Loading';
import { sdk } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Borrador',    className: 'bg-gray-100 text-gray-600' },
  ACTIVE:    { label: 'Activo',      className: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completado',  className: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelado',   className: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Create Event Modal ───────────────────────────────────────────────────────
function CreateEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (event: any) => void }) {
  const [form, setForm] = useState({ name: '', description: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    setSaving(true);
    setError(null);
    try {
      const event = await sdk.createEvent({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onCreate(event);
    } catch (err: any) {
      setError(err.message || 'Error al crear el evento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00]"
              placeholder="Ej: Boda García-López, Quince años Ana"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] resize-none"
              rows={3}
              placeholder="Descripción del evento (opcional)"
              maxLength={2000}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lugar del evento</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00]"
              placeholder="Ej: Salón El Ciprés, Ciudad de Guatemala"
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] resize-none"
              rows={2}
              placeholder="Notas privadas (opcional)"
              maxLength={2000}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#FF6A00] text-white rounded-lg py-2.5 text-sm font-bold hover:bg-[#e55a00] transition-colors disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: any }) {
  const bookingCount = (event.bookings ?? []).length;
  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-gray-400 mb-0.5">{event.code}</p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{event.name}</h3>
          </div>
          <StatusBadge status={event.status} />
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <UsersIcon className="w-4 h-4 text-gray-400" />
            <span>{bookingCount} {bookingCount === 1 ? 'reserva' : 'reservas'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-[#FF6A00]">
            Ver detalles <ChevronRightIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-4">
        <CalendarIcon className="w-8 h-8 text-[#FF6A00]" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Aún no tienes eventos</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        Crea un evento para organizar múltiples artistas en una sola ocasión.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 bg-[#FF6A00] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#e55a00] transition-colors"
      >
        <PlusIcon /> Crear primer evento
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await sdk.getClientEvents();
        if (mounted) setEvents(data ?? []);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error al cargar eventos');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const handleCreated = (newEvent: any) => {
    setEvents((prev) => [newEvent, ...prev]);
    setShowCreate(false);
    router.push(`/events/${newEvent.id}`);
  };

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={userName} />
        <PageHelpButton tourId="eventsTour" />
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-20 lg:pt-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
            <p className="text-gray-500 text-sm mt-1">Organiza múltiples artistas en un solo evento</p>
          </div>
          {events.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-[#FF6A00] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#e55a00] transition-colors shadow-sm"
            >
              <PlusIcon /> Nuevo evento
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{error}</div>
        )}

        {/* Stats strip */}
        {events.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Totales', value: events.length, color: 'text-[#FF6A00] bg-orange-50' },
              { label: 'Activos', value: events.filter((e) => e.status === 'ACTIVE').length, color: 'text-green-600 bg-green-50' },
              { label: 'Borradores', value: events.filter((e) => e.status === 'DRAFT').length, color: 'text-gray-600 bg-gray-100' },
              { label: 'Cancelados', value: events.filter((e) => e.status === 'CANCELLED').length, color: 'text-red-600 bg-red-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {events.length === 0 ? (
          <EmptyState onNew={() => setShowCreate(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
