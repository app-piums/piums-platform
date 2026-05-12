'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { Loading } from '@/components/Loading';
import { sdk } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlusIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MapPinIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PencilIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ChevronLeftIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const XIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Borrador',   className: 'bg-gray-100 text-gray-600' },
  ACTIVE:    { label: 'Activo',     className: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completado', className: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
};

const BOOKING_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING:          { label: 'Pendiente',  className: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:        { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  PAYMENT_PENDING:  { label: 'Pago pend.', className: 'bg-orange-100 text-orange-700' },
  COMPLETED:        { label: 'Completada', className: 'bg-blue-100 text-blue-700' },
  CANCELLED_CLIENT: { label: 'Cancelada',  className: 'bg-red-100 text-red-600' },
  CANCELLED_ARTIST: { label: 'Cancelada',  className: 'bg-red-100 text-red-600' },
  REJECTED:         { label: 'Rechazada',  className: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; className: string }> }) {
  const cfg = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmCancelModal({
  eventName,
  onClose,
  onConfirm,
}: {
  eventName: string;
  onClose: () => void;
  onConfirm: (cancelBookings: boolean) => void;
}) {
  const [cancelBookings, setCancelBookings] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cancelar evento?</h2>
        <p className="text-sm text-gray-600 mb-5">
          Estás a punto de cancelar <span className="font-semibold">{eventName}</span>. Esta acción no se puede deshacer.
        </p>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={cancelBookings}
            onChange={(e) => setCancelBookings(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
          />
          <span className="text-sm text-gray-700">
            Cancelar también las reservas <span className="font-medium">PENDIENTES y CONFIRMADAS</span> asociadas a este evento
          </span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            No, volver
          </button>
          <button
            onClick={() => onConfirm(cancelBookings)}
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700"
          >
            Sí, cancelar evento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Event Modal ─────────────────────────────────────────────────────────
function EditEventModal({
  event,
  onClose,
  onSaved,
}: {
  event: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: event.name || '',
    description: event.description || '',
    location: event.location || '',
    notes: event.notes || '',
    eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    setSaving(true);
    setError(null);
    try {
      const updated = await sdk.updateEvent(event.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
      });
      onSaved(updated);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Editar Evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]" maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] resize-none" rows={3} maxLength={2000} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del evento</label>
            <input type="date" value={form.eventDate} min={today} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
            <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]" maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] resize-none" rows={2} maxLength={2000} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#FF6B35] text-white rounded-lg py-2.5 text-sm font-bold hover:bg-[#e55a00] disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Booking Modal ────────────────────────────────────────────────────────
function AddBookingModal({
  eventId,
  eventDate,
  onClose,
  onAdded,
}: {
  eventId: string;
  eventDate?: string;
  onClose: () => void;
  onAdded: (booking: any) => void;
}) {
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const dateFilter = eventDate ? { startDate: eventDate, endDate: eventDate } : {};
        const [pendingResult, confirmedResult] = await Promise.all([
          sdk.listBookings({ status: 'PENDING', ...dateFilter, limit: 100 }),
          eventDate ? sdk.listBookings({ status: 'CONFIRMED', ...dateFilter, limit: 100 }) : Promise.resolve({ bookings: [] }),
        ]);
        const all = [
          ...(pendingResult?.bookings ?? []),
          ...(confirmedResult?.bookings ?? []),
        ];
        if (mounted) {
          setPendingBookings(all.filter((b: any) => !b.eventId));
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error al cargar reservas');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventDate]);

  const handleAdd = async (bookingId: string) => {
    setAdding(bookingId);
    setError(null);
    try {
      const updated = await sdk.addBookingToEvent(eventId, bookingId);
      onAdded(updated);
    } catch (err: any) {
      setError(err.message || 'Error al agregar la reserva');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Agregar reserva al evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {eventDate && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-4 text-sm text-orange-700">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span>Mostrando reservas del <span className="font-semibold">{new Date(eventDate + 'T12:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-8"><Loading /></div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm mb-3">
                {eventDate
                  ? 'No hay reservas disponibles para esta fecha.'
                  : 'No tienes reservas PENDIENTES disponibles para agregar.'}
              </p>
              <p className="text-xs text-gray-400">
                {eventDate
                  ? 'Solo se muestran reservas PENDIENTES o CONFIRMADAS programadas para la fecha del evento que no pertenezcan a otro evento.'
                  : 'Solo se pueden agregar reservas en estado PENDIENTE que no pertenezcan a otro evento.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingBookings.map((b: any) => {
                const date = b.scheduledDate ? new Date(b.scheduledDate) : null;
                const formattedDate = date ? date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-400">{b.code}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.serviceName || b.serviceId}</p>
                      <p className="text-xs text-gray-500">{b.artistName || b.artistId} · {formattedDate}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(b.id)}
                      disabled={adding === b.id}
                      className="shrink-0 bg-[#FF6B35] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#e55a00] disabled:opacity-50 transition-colors"
                    >
                      {adding === b.id ? '…' : 'Agregar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
          <Link
            href={`/booking?eventId=${eventId}${eventDate ? `&date=${eventDate}` : ''}`}
            className="flex items-center justify-center gap-2 w-full bg-[#FF6B35] text-white font-bold rounded-xl py-2.5 text-sm hover:bg-[#e55a00] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Reservar nuevo artista para este evento
          </Link>
          <button onClick={onClose} className="w-full border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────
function BookingRow({ booking, eventStatus, onRemove }: { booking: any; eventStatus: string; onRemove: (id: string) => void }) {
  const date = booking.scheduledDate ? new Date(booking.scheduledDate) : null;
  const formattedDate = date ? date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const formattedTime = date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const price = Number(booking.totalPrice || booking.amount || 0);
  const curr = booking.currency || 'USD';
  const symbol = '$';

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-mono text-gray-400">{booking.code}</p>
          <StatusBadge status={booking.status} map={BOOKING_STATUS_MAP} />
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{booking.serviceName || 'Servicio'}</p>
        <p className="text-xs text-gray-500">{booking.artistName || booking.artistId} · {formattedDate} {formattedTime}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#FF6B35]">{symbol}{(price / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        {eventStatus !== 'CANCELLED' && (
          <Link
            href={`/bookings/${booking.id}`}
            className="text-xs text-gray-400 hover:text-[#FF6B35] transition-colors"
          >
            Ver detalle
          </Link>
        )}
      </div>
      {eventStatus !== 'CANCELLED' && (
        <button
          onClick={() => onRemove(booking.id)}
          className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Quitar del evento"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  const [event, setEvent] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancel, setShowCancel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [ev, bd] = await Promise.all([
          sdk.getEvent(id),
          sdk.getEventBreakdown(id).catch(() => null),
        ]);
        if (mounted) {
          setEvent(ev);
          setBreakdown(bd);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error al cargar el evento');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isAuthenticated]);

  const handleCancelConfirm = async (cancelBookings: boolean) => {
    setCancelling(true);
    try {
      const updated = await sdk.cancelEvent(id, cancelBookings);
      setEvent(updated);
      setShowCancel(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar el evento');
    } finally {
      setCancelling(false);
    }
  };

  const handleBookingRemove = async (bookingId: string) => {
    if (!confirm('¿Quitar esta reserva del evento?')) return;
    try {
      await sdk.removeBookingFromEvent(id, bookingId);
      setEvent((prev: any) => ({
        ...prev,
        bookings: (prev.bookings ?? []).filter((b: any) => b.id !== bookingId),
      }));
    } catch (err: any) {
      toast.error(err.message || 'Error al quitar la reserva');
    }
  };

  const handleBookingAdded = (updatedBooking: any) => {
    setEvent((prev: any) => ({
      ...prev,
      status: prev.status === 'DRAFT' ? 'ACTIVE' : prev.status,
      bookings: [...(prev.bookings ?? []), updatedBooking],
    }));
    setShowAddBooking(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={userName} />
        <div className="flex-1 min-w-0 flex items-center justify-center"><Loading /></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={userName} />
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xl font-semibold text-gray-900 mb-2">Evento no encontrado</p>
          <p className="text-sm text-gray-500 mb-5">{error || 'No pudimos encontrar este evento.'}</p>
          <Link href="/events" className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-orange-600 transition">
            Volver a Eventos
          </Link>
        </div>
      </div>
    );
  }

  const bookings: any[] = event.bookings ?? [];
  const isCancelled = event.status === 'CANCELLED';
  const grandTotal = breakdown?.grandTotalCents ?? 0;
  const currency = breakdown?.currency || 'USD';
  const symbol = '$';

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-20 lg:pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/events" className="flex items-center gap-1 hover:text-[#FF6B35] transition-colors">
            <ChevronLeftIcon className="w-4 h-4" /> Eventos
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{event.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs font-mono text-gray-400">{event.code}</p>
              <StatusBadge status={event.status} map={STATUS_MAP} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{event.name}</h1>
            {event.eventDate && (
              <div className="flex items-center gap-1.5 text-sm text-[#FF6B35] font-medium mt-1.5">
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span className="capitalize">{new Date(event.eventDate).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          {!isCancelled && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={() => setShowAddBooking(true)}
                className="inline-flex items-center gap-1.5 bg-[#FF6B35] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#e55a00] transition-colors"
              >
                <PlusIcon /> Agregar reserva
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Cancelar evento
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: bookings list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Reservas ({bookings.length})
              </h2>
              {!isCancelled && (
                <Link
                  href={`/artists?eventId=${id}`}
                  className="text-xs font-medium text-[#FF6B35] hover:underline"
                >
                  + Reservar nuevo artista
                </Link>
              )}
            </div>

            {bookings.length === 0 ? (
              <div className="text-center bg-white rounded-2xl border border-dashed border-gray-200 py-12 px-4">
                <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay reservas en este evento aún.</p>
                {!isCancelled && (
                  <button
                    onClick={() => setShowAddBooking(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#e55a00]"
                  >
                    <PlusIcon /> Agregar reserva existente
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b: any) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    eventStatus={event.status}
                    onRemove={handleBookingRemove}
                  />
                ))}
              </div>
            )}

            {/* Description / Notes */}
            {(event.description || event.notes) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4 space-y-3">
                {event.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}
                {event.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notas internas</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{event.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: price breakdown */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-[#FF6B35] px-5 py-4">
                <p className="text-white font-bold">Desglose de precios</p>
              </div>
              <div className="p-5 space-y-3">
                {bookings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Agrega reservas para ver el total</p>
                ) : (
                  <>
                    {(breakdown?.bookings ?? bookings).map((b: any) => {
                      const price = Number(b.totalPrice || b.totalPriceCents || 0);
                      const label = b.serviceName || b.code || b.bookingId?.slice(0, 8).toUpperCase();
                      const isActive = !['CANCELLED_CLIENT', 'CANCELLED_ARTIST', 'REJECTED'].includes(b.status);
                      return (
                        <div key={b.id || b.bookingId} className="flex items-center justify-between text-sm">
                          <span className={`truncate flex-1 ${isActive ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{label}</span>
                          <span className={`font-medium ml-3 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {symbol}{(price / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-100 pt-3 mt-1 flex items-center justify-between font-bold">
                      <span className="text-gray-900">Total estimado</span>
                      <span className="text-[#FF6B35] text-lg">
                        {symbol}{(grandTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">* Solo incluye reservas activas</p>
                  </>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-600 space-y-2">
              {event.eventDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-[#FF6B35] font-medium">{new Date(event.eventDate).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Creado</span>
                <span>{new Date(event.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado</span>
                <StatusBadge status={event.status} map={STATUS_MAP} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCancel && (
        <ConfirmCancelModal
          eventName={event.name}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
      {showEdit && (
        <EditEventModal
          event={event}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setEvent((prev: any) => ({ ...prev, ...updated })); setShowEdit(false); }}
        />
      )}
      {showAddBooking && (
        <AddBookingModal
          eventId={id}
          eventDate={event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : undefined}
          onClose={() => setShowAddBooking(false)}
          onAdded={handleBookingAdded}
        />
      )}
    </div>
  );
}
