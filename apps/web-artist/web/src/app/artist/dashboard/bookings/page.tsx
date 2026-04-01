'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { ReportarQuejaModal } from '@/components/quejas/ReportarQuejaModal';
import { sdk, Booking } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'ALL';

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
    PENDING: null, CONFIRMED: null, COMPLETED: null, CANCELLED: null,
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
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
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

  const STATUS_ES: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  };

  const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-amber-100 text-amber-700 border border-amber-200',
    CONFIRMED: 'bg-green-100 text-green-700 border border-green-200',
    COMPLETED: 'bg-blue-100  text-blue-700  border border-blue-200',
    CANCELLED: 'bg-gray-100  text-gray-600  border border-gray-200',
  };

  const BORDER_ACCENT: Record<string, string> = {
    PENDING:   'border-l-amber-400',
    CONFIRMED: 'border-l-green-500',
    COMPLETED: 'border-l-blue-500',
    CANCELLED: 'border-l-gray-400',
  };

  const statusCountValues = Object.values(statusCounts);

  const hasAllStatusCounts = statusCountValues.every(
    (value): value is number => typeof value === 'number'
  );

  const allCount: number | null = hasAllStatusCounts
    ? statusCountValues.reduce((sum, value) => sum + value, 0)
    : null;

  const TABS: Array<{ value: BookingStatus; label: string }> = [
    { value: 'PENDING',   label: 'Pendientes'  },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas'  },
    { value: 'ALL',       label: 'Todas'        },
  ];

  const STATS = [
    { label: 'Total Reservas', count: allCount,                    color: 'text-[#FF6A00] bg-orange-50', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
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
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
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
                    ? 'bg-[#FF6A00] text-white shadow-sm shadow-orange-200'
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00] mx-auto mb-4"></div>
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
