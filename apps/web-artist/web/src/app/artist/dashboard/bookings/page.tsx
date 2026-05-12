'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { ReportarQuejaModal } from '@/components/quejas/ReportarQuejaModal';
import Link from 'next/link';
import { sdk, Booking } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';
import { Check, X, Cake, Gem, GraduationCap, Crown, Building2, Music, PartyPopper, Baby, Church, Wine, HelpCircle, CalendarDays } from 'lucide-react';

const EVENT_TYPE_ICONS: Record<string, React.ReactElement> = {
  CUMPLEANOS:  <Cake       size={16} />,
  BODA:        <Gem        size={16} />,
  GRADUACION:  <GraduationCap size={16} />,
  QUINCEANERA: <Crown      size={16} />,
  CORPORATIVO: <Building2  size={16} />,
  CONCIERTO:   <Music      size={16} />,
  FIESTA:      <PartyPopper size={16} />,
  BABY_SHOWER: <Baby       size={16} />,
  BAUTIZO:     <Church     size={16} />,
  ANIVERSARIO: <Wine       size={16} />,
  OTRO:        <HelpCircle size={16} />,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  CUMPLEANOS:'Cumpleaños', BODA:'Boda', GRADUACION:'Graduación', QUINCEANERA:'Quinceañera',
  CORPORATIVO:'Evento Corporativo', CONCIERTO:'Concierto / Festival', FIESTA:'Fiesta / Celebración',
  BABY_SHOWER:'Baby Shower', BAUTIZO:'Bautizo / Bienvenida', ANIVERSARIO:'Aniversario', OTRO:'Otro',
};
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { cImg } from '@/lib/cloudinaryImg';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'RESCHEDULE_PENDING_ARTIST' | 'NO_SHOW' | 'ALL';

type ArtistBookingsFilters = {
  status?: BookingStatus;
  page?: number;
  limit?: number;
};

type ArtistBookingsResponse = {
  bookings: Booking[];
  total: number;
  totalPages: number;
};

export default function ArtistBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userName = (user as any)?.nombre ?? (user as any)?.email ?? 'Artista';
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeStatus, setActiveStatus] = useState<BookingStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [quejaBooking, setQuejaBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number | null>>({
    PENDING: null, CONFIRMED: null, COMPLETED: null, CANCELLED: null, REJECTED: null,
  });

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: ArtistBookingsFilters = {
        page: currentPage,
        limit: 10,
      };

      if (activeStatus !== 'ALL') {
        filters.status = activeStatus;
      }

      const result = (await sdk.getArtistBookings(filters)) as ArtistBookingsResponse;
      setBookings(result.bookings);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading bookings:', message);
      setError(message || 'Error al cargar las reservas');

      if (isUnauthorizedError(err)) {
        router.push('/login?redirect=/artist/dashboard/bookings');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus, currentPage, router]);

  const loadStatusCounts = useCallback(async () => {
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const;
    const results = await Promise.allSettled(
      statuses.map(async (status) => {
        const response = (await sdk.getArtistBookings({ status, page: 1, limit: 1 })) as ArtistBookingsResponse;
        return response.total;
      })
    );
    const counts: Record<string, number | null> = {};
    results.forEach((result, index) => {
      counts[statuses[index]] = result.status === 'fulfilled' ? result.value : 0;
    });
    setStatusCounts(counts);
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    void loadStatusCounts();
  }, [loadStatusCounts]);


  const handleAccept = async (bookingId: string) => {
    if (!confirm('¿Confirmar aceptar esta reserva?')) return;

    try {
      setProcessingBookingId(bookingId);
      await sdk.acceptBooking(bookingId);
      await loadBookings();
      void loadStatusCounts();
      toast.success('Reserva aceptada exitosamente');
    } catch (err: unknown) {
      console.error('Error accepting booking:', getErrorMessage(err));
      toast.error(getErrorMessage(err) || 'Error al aceptar la reserva');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleDecline = async (bookingId: string) => {
    const reason = prompt('¿Razón del rechazo? (opcional)');
    if (reason === null) return; // Usuario canceló

    try {
      setProcessingBookingId(bookingId);
      await sdk.declineBooking(bookingId, reason);
      await loadBookings();
      void loadStatusCounts();
      toast.success('Reserva rechazada');
    } catch (err: unknown) {
      console.error('Error declining booking:', getErrorMessage(err));
      toast.error(getErrorMessage(err) || 'Error al rechazar la reserva');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    if (!confirm('¿Marcar esta reserva como completada? Esta acción no se puede deshacer.')) return;
    try {
      setProcessingBookingId(bookingId);
      await sdk.completeBooking(bookingId);
      setSelectedBooking(null);
      await loadBookings();
      void loadStatusCounts();
      toast.success('Reserva marcada como completada');
    } catch (err: unknown) {
      console.error('Error completing booking:', getErrorMessage(err));
      toast.error(getErrorMessage(err) || 'Error al completar la reserva');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('¿Razón de la cancelación? (mínimo 10 caracteres)');
    if (reason === null) return;
    if (reason.trim().length < 10) { toast.warning('La razón debe tener al menos 10 caracteres'); return; }
    try {
      setProcessingBookingId(bookingId);
      await sdk.artistCancelBooking(bookingId, reason.trim());
      setSelectedBooking(null);
      await loadBookings();
      void loadStatusCounts();
      toast.success('Reserva cancelada');
    } catch (err: unknown) {
      console.error('Error cancelling booking:', getErrorMessage(err));
      toast.error(getErrorMessage(err) || 'Error al cancelar la reserva');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRespondReschedule = async (requestId: string, accept: boolean, bookingId: string) => {
    const rejectionReason = !accept ? prompt('¿Por qué rechazas el cambio de fecha? (opcional)') ?? undefined : undefined;
    if (!accept && rejectionReason === null) return;

    try {
      setProcessingBookingId(bookingId);
      const res = await fetch(`/api/reschedule-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al responder');
      toast.success(accept ? 'Aceptado. Se enviará enlace al cliente.' : 'Solicitud rechazada.');
      await loadBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al responder');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const STATUS_ES: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    REJECTED: 'Rechazada',
    RESCHEDULE_PENDING_ARTIST: 'Cambio de fecha',
    RESCHEDULE_PENDING_CLIENT: 'Esperando cliente',
    RESCHEDULED: 'Reprogramada',
    NO_SHOW: 'No se presentó',
    IN_PROGRESS: 'En progreso',
    ANTICIPO_PAID: 'Anticipo pagado',
    PAYMENT_COMPLETED: 'Pago completado',
    DELIVERED: 'Entregada',
  };

  const STATUS_STYLES: Record<string, string> = {
    PENDING:          'bg-amber-100 text-amber-700 border border-amber-200',
    CONFIRMED:        'bg-green-100 text-green-700 border border-green-200',
    COMPLETED:        'bg-blue-100  text-blue-700  border border-blue-200',
    CANCELLED:        'bg-gray-100  text-gray-600  border border-gray-200',
    REJECTED:         'bg-red-100   text-red-600   border border-red-200',
    NO_SHOW:          'bg-red-100   text-red-700   border border-red-200',
    IN_PROGRESS:      'bg-teal-100  text-teal-700  border border-teal-200',
    ANTICIPO_PAID:    'bg-violet-100 text-violet-700 border border-violet-200',
    PAYMENT_COMPLETED:'bg-green-100 text-green-700 border border-green-200',
    DELIVERED:        'bg-blue-100  text-blue-700  border border-blue-200',
  };

  const BORDER_ACCENT: Record<string, string> = {
    PENDING:                   'border-l-amber-400',
    CONFIRMED:                 'border-l-green-500',
    COMPLETED:                 'border-l-blue-500',
    CANCELLED:                 'border-l-gray-400',
    REJECTED:                  'border-l-red-400',
    RESCHEDULE_PENDING_ARTIST: 'border-l-purple-400',
    RESCHEDULE_PENDING_CLIENT: 'border-l-purple-300',
    RESCHEDULED:               'border-l-teal-400',
    NO_SHOW:                   'border-l-red-500',
    IN_PROGRESS:               'border-l-teal-500',
    ANTICIPO_PAID:             'border-l-violet-400',
    PAYMENT_COMPLETED:         'border-l-green-500',
    DELIVERED:                 'border-l-blue-500',
  };

  const statusCountValues = Object.values(statusCounts);

  const hasAllStatusCounts = statusCountValues.every(
    (value): value is number => typeof value === 'number'
  );

  const allCount: number | null = hasAllStatusCounts
    ? statusCountValues.reduce((sum, value) => sum + value, 0)
    : null;

  const TABS: Array<{ value: BookingStatus; label: string }> = [
    { value: 'PENDING',                  label: 'Pendientes'    },
    { value: 'RESCHEDULE_PENDING_ARTIST', label: 'Cambio fecha' },
    { value: 'CONFIRMED',                label: 'Confirmadas'   },
    { value: 'COMPLETED',                label: 'Completadas'   },
    { value: 'CANCELLED',                label: 'Canceladas'    },
    { value: 'REJECTED',                 label: 'Rechazadas'    },
    { value: 'NO_SHOW',                  label: 'No-show'       },
    { value: 'ALL',                      label: 'Todas'          },
  ];

  const STATS = [
    { label: 'Total Reservas', count: allCount,                    color: 'text-[#FF6B35] bg-orange-50', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { label: 'Confirmadas',    count: statusCounts.CONFIRMED,      color: 'text-blue-600 bg-blue-50',    icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Pendientes',     count: statusCounts.PENDING,        color: 'text-yellow-600 bg-yellow-50', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Completadas',    count: statusCounts.COMPLETED,      color: 'text-green-600 bg-green-50',  icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <DashboardSidebar />
        <PageHelpButton tourId="artistGigsTour" />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 mt-14 lg:mt-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reservas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestiona las reservas recibidas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 lg:px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map(({ label, count, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {count === null ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-100 animate-pulse" />
                    ) : count}
                  </p>
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => { setActiveStatus(tab.value); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeStatus === tab.value
                    ? 'bg-[#FF6B35] text-white shadow-sm shadow-orange-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Cargando reservas...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadBookings}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Bookings List */}
          {!isLoading && !error && (
            <>
              {bookings.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                        BORDER_ACCENT[booking.status] ?? 'border-l-gray-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono text-gray-400 shrink-0">#{booking.code || booking.id.slice(0, 8)}</span>
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-600'
                          }`}>
                            {STATUS_ES[booking.status] ?? booking.status}
                          </span>
                        </div>
                        {/* Price — prominent on header */}
                        <p className="text-base font-bold text-orange-600 shrink-0 ml-2">
                          ${(booking.totalPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Card Body */}
                      <div className="px-4 py-3 space-y-2.5">
                        {/* Client */}
                        {(booking as any).clientName && (
                          <div className="flex items-center gap-2">
                            <div className="relative h-7 w-7 rounded-full overflow-hidden bg-orange-100 shrink-0">
                              {(booking as any).clientAvatar ? (
                                <img src={cImg((booking as any).clientAvatar)} alt={(booking as any).clientName} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-600">
                                  {((booking as any).clientName as string).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 leading-none">Cliente</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{(booking as any).clientName}</p>
                            </div>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-start gap-2.5">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400 leading-none mb-0.5">Fecha</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(booking.scheduledDate).toLocaleDateString('es-GT', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                              {' · '}
                              {new Date(booking.scheduledDate).toLocaleTimeString('es-GT', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Duration + Location in a row on mobile */}
                        <div className="flex gap-4">
                          <div className="flex items-start gap-2.5 flex-1">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-400 leading-none mb-0.5">Duración</p>
                              <p className="text-sm font-medium text-gray-900">{booking.durationMinutes} min</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 flex-[2] min-w-0">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 leading-none mb-0.5">Ubicación</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{booking.location || 'No especificada'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Event type */}
                        {(booking as any).eventType && (
                          <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                            <span className="text-orange-500">
                              {EVENT_TYPE_ICONS[(booking as any).eventType] ?? <CalendarDays size={16} />}
                            </span>
                            <p className="text-xs font-semibold text-orange-800">
                              {EVENT_TYPE_LABELS[(booking as any).eventType] ?? (booking as any).eventType}
                            </p>
                          </div>
                        )}

                        {/* Client notes */}
                        {booking.clientNotes && (
                          <div className="flex items-start gap-2.5 bg-amber-50 rounded-lg px-3 py-2.5">
                            <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <p className="text-xs text-amber-800 leading-relaxed">{booking.clientNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions — full width on mobile */}
                      {booking.status === 'RESCHEDULE_PENDING_ARTIST' && (
                        <div className="px-4 pb-4 pt-1 space-y-2">
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                            <p className="text-xs font-semibold text-purple-800 mb-0.5">Solicitud de cambio de fecha</p>
                            <p className="text-xs text-purple-700">El cliente solicita cambiar la fecha de esta reserva. Acepta si tienes disponibilidad, o rechaza para mantener la fecha original.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // requestId comes from rescheduleRequests — fetch inline
                                fetch(`/api/bookings/${booking.id}/reschedule-requests`)
                                  .then(r => r.json())
                                  .then(d => {
                                    const pending = (d.requests || []).find((r: any) => r.status === 'PENDING_ARTIST');
                                    if (pending) void handleRespondReschedule(pending.id, true, booking.id);
                                  });
                              }}
                              disabled={processingBookingId === booking.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {processingBookingId === booking.id ? (
                                <span className="flex items-center gap-1.5"><span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />Procesando</span>
                              ) : (
                                <><Check size={14} /> Aceptar cambio</>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetch(`/api/bookings/${booking.id}/reschedule-requests`)
                                  .then(r => r.json())
                                  .then(d => {
                                    const pending = (d.requests || []).find((r: any) => r.status === 'PENDING_ARTIST');
                                    if (pending) void handleRespondReschedule(pending.id, false, booking.id);
                                  });
                              }}
                              disabled={processingBookingId === booking.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-lg border-2 border-red-500 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <X size={14} /> Rechazar
                            </button>
                          </div>
                        </div>
                      )}
                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2 px-4 pb-4 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleAccept(booking.id); }}
                            disabled={processingBookingId === booking.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {processingBookingId === booking.id ? (
                              <span className="flex items-center gap-1.5"><span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />Procesando</span>
                            ) : (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Aceptar</>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleDecline(booking.id); }}
                            disabled={processingBookingId === booking.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-lg border-2 border-red-500 hover:bg-red-50 active:scale-95 transition-all disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            Rechazar
                          </button>
                        </div>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <div className="flex gap-2 px-4 pb-4 pt-1 flex-wrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleComplete(booking.id); }}
                            disabled={processingBookingId === booking.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {processingBookingId === booking.id ? (
                              <span className="flex items-center gap-1.5"><span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />Procesando</span>
                            ) : (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Marcar completada</>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleCancel(booking.id); }}
                            disabled={processingBookingId === booking.id}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Cancelar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuejaBooking(booking); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H7a2 2 0 01-2-2zm0 0h2" /></svg>
                            Reportar queja
                          </button>
                        </div>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <div className="flex gap-2 px-4 pb-4 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuejaBooking(booking); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H7a2 2 0 01-2-2zm0 0h2" /></svg>
                            Reportar queja
                          </button>
                        </div>
                      )}
                      {booking.status === 'NO_SHOW' && (
                        <div className="px-4 pb-4 pt-1">
                          <Link
                            href="/artist/dashboard/quejas"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full justify-center py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Ver disputa abierta
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin reservas</h3>
                  <p className="text-sm text-gray-500">
                    {activeStatus === 'PENDING'
                      ? 'No tienes reservas pendientes'
                      : `No hay reservas ${STATUS_ES[activeStatus]?.toLowerCase() ?? ''}`}
                  </p>
                </div>
              )}
          {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <p className="text-sm text-gray-600">
                    Mostrando {bookings.length} de {total} reservas
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {quejaBooking && (
        <ReportarQuejaModal
          bookingId={quejaBooking.id}
          onClose={() => setQuejaBooking(null)}
          onSuccess={() => {
            setQuejaBooking(null);
            toast.success('Tu queja fue enviada. Puedes seguir el estado en la sección Quejas.');
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 border-l-4 rounded-t-2xl ${
              BORDER_ACCENT[selectedBooking.status] ?? 'border-l-gray-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">#{selectedBooking.code || selectedBooking.id.slice(0, 8)}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[selectedBooking.status] ?? 'bg-gray-100 text-gray-600'
                }`}>
                  {STATUS_ES[selectedBooking.status] ?? selectedBooking.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4">

              {/* Participantes */}
              {(() => {
                const b = selectedBooking as any;
                const clientName: string = b.clientName || b.clientEmail || 'Cliente';
                const clientAvatar: string | undefined = b.clientAvatar;
                const clientEmail: string | undefined = b.clientEmail;
                const artistAvatar: string | undefined = (user as any)?.avatar;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Artista (tú) */}
                    <div className="flex flex-col items-center gap-2 bg-purple-50 rounded-xl px-3 py-3 text-center">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-purple-200 shrink-0">
                        {artistAvatar ? (
                          <img src={cImg(artistAvatar)} alt={userName} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-purple-700">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 mb-0.5">Artista</p>
                        <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="flex flex-col items-center gap-2 bg-orange-50 rounded-xl px-3 py-3 text-center">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-orange-200 shrink-0">
                        {clientAvatar ? (
                          <img src={cImg(clientAvatar)} alt={clientName} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-orange-700">
                            {clientName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 mb-0.5">Cliente</p>
                        <p className="text-xs font-semibold text-gray-900 truncate">{clientName}</p>
                        {clientEmail && clientEmail !== clientName && (
                          <p className="text-[10px] text-gray-400 truncate">{clientEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Price */}
              <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-xl font-bold text-orange-600">${(selectedBooking.totalPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Fecha</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedBooking.scheduledDate).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {new Date(selectedBooking.scheduledDate).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400">Duración</p>
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Ubicación</p>
                      <p className="text-sm font-medium text-gray-900 break-words">{selectedBooking.location || 'No especificada'}</p>
                    </div>
                  </div>
                </div>

                {selectedBooking.clientNotes && (
                  <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div>
                      <p className="text-xs text-amber-700 font-medium mb-0.5">Notas del cliente</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{selectedBooking.clientNotes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* No-show banner */}
              {selectedBooking.status === 'NO_SHOW' && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700">No-show reportado</p>
                      <p className="mt-0.5 text-xs text-red-600">
                        El cliente reportó que no te presentaste a esta reserva. Si crees que hay un error, responde la disputa abierta.
                      </p>
                      <Link
                        href="/artist/dashboard/quejas"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                        onClick={() => setSelectedBooking(null)}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Ver mis quejas
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acciones</p>

                {selectedBooking.status === 'PENDING' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => void handleAccept(selectedBooking.id)}
                      disabled={processingBookingId === selectedBooking.id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processingBookingId === selectedBooking.id ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      )}
                      Aceptar reserva
                    </button>
                    <button
                      onClick={() => void handleDecline(selectedBooking.id)}
                      disabled={processingBookingId === selectedBooking.id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 font-semibold rounded-xl border-2 border-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Rechazar reserva
                    </button>
                    <button
                      onClick={() => void handleCancel(selectedBooking.id)}
                      disabled={processingBookingId === selectedBooking.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-gray-600 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Cancelar reserva
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'CONFIRMED' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => void handleComplete(selectedBooking.id)}
                      disabled={processingBookingId === selectedBooking.id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processingBookingId === selectedBooking.id ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      Marcar como completada
                    </button>
                    <button
                      onClick={() => void handleCancel(selectedBooking.id)}
                      disabled={processingBookingId === selectedBooking.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-gray-600 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Cancelar reserva
                    </button>
                    <button
                      onClick={() => { setSelectedBooking(null); setQuejaBooking(selectedBooking); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H7a2 2 0 01-2-2zm0 0h2" /></svg>
                      Reportar queja
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'COMPLETED' && (
                  <button
                    onClick={() => { setSelectedBooking(null); setQuejaBooking(selectedBooking); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H7a2 2 0 01-2-2zm0 0h2" /></svg>
                    Reportar queja
                  </button>
                )}

                {(selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'COMPLETED') && selectedBooking.status !== 'COMPLETED' && (
                  <p className="text-center text-sm text-gray-400 py-2">No hay acciones disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
