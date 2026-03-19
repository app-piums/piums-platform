'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, Booking } from '@piums/sdk';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'ALL';

export default function ArtistBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeStatus, setActiveStatus] = useState<BookingStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number | null>>({
    PENDING: null, CONFIRMED: null, COMPLETED: null, CANCELLED: null,
  });

  useEffect(() => {
    loadBookings();
  }, [activeStatus, currentPage]);

  useEffect(() => {
    loadStatusCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        limit: 10,
      };

      if (activeStatus !== 'ALL') {
        filters.status = activeStatus;
      }

      const result = await sdk.getArtistBookings(filters);
      setBookings(result.bookings);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Error al cargar las reservas');
      
      if (err.message?.includes('No autenticado') || err.message?.includes('401')) {
        router.push('/login?redirect=/artist/dashboard/bookings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
    const results = await Promise.allSettled(
      statuses.map((s) => sdk.getArtistBookings({ status: s as any, page: 1, limit: 1 }))
    );
    const counts: Record<string, number | null> = {};
    results.forEach((r, i) => {
      counts[statuses[i]] = r.status === 'fulfilled' ? r.value.total : 0;
    });
    setStatusCounts(counts);
  };

  const handleAccept = async (bookingId: string) => {
    if (!confirm('¿Confirmar aceptar esta reserva?')) return;

    try {
      setProcessingBookingId(bookingId);
      await sdk.acceptBooking(bookingId);
      await loadBookings();
      void loadStatusCounts();
      alert('Reserva aceptada exitosamente');
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      alert(err.message || 'Error al aceptar la reserva');
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
      alert('Reserva rechazada');
    } catch (err: any) {
      console.error('Error declining booking:', err);
      alert(err.message || 'Error al rechazar la reserva');
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

  const allCount: number | null = Object.values(statusCounts).every(v => v !== null)
    ? Object.values(statusCounts).reduce((s, v) => s + (v ?? 0), 0) as number
    : null;

  const CHIP_CONFIG: Array<{
    value: BookingStatus;
    label: string;
    inactiveCls: string;
    activeCls: string;
    ringCls: string;
  }> = [
    { value: 'PENDING',   label: 'Pendientes', inactiveCls: 'border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100',     activeCls: 'bg-amber-500 text-white',    ringCls: 'ring-amber-400'  },
    { value: 'CONFIRMED', label: 'Confirmadas', inactiveCls: 'border border-green-300 text-green-700 bg-green-50 hover:bg-green-100',     activeCls: 'bg-green-600 text-white',    ringCls: 'ring-green-400'  },
    { value: 'COMPLETED', label: 'Completadas', inactiveCls: 'border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100',        activeCls: 'bg-blue-600 text-white',     ringCls: 'ring-blue-400'   },
    { value: 'CANCELLED', label: 'Canceladas',  inactiveCls: 'border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100',        activeCls: 'bg-gray-500 text-white',     ringCls: 'ring-gray-400'   },
    { value: 'ALL',       label: 'Todas',       inactiveCls: 'border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100', activeCls: 'bg-orange-500 text-white',   ringCls: 'ring-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <DashboardSidebar />
      
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reservas</h1>
            <p className="text-gray-500 text-sm">Gestiona las reservas recibidas</p>
          </div>

          {/* Filter chips with live counts */}
          <div className="flex flex-wrap gap-2 mb-5">
            {CHIP_CONFIG.map(({ value, label, inactiveCls, activeCls, ringCls }) => {
              const count = value === 'ALL' ? allCount : (statusCounts[value] ?? null);
              const isActive = activeStatus === value;
              return (
                <button
                  key={value}
                  onClick={() => { setActiveStatus(value); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 ${
                    isActive ? `${activeCls} ring-2 ring-offset-1 ${ringCls}` : inactiveCls
                  }`}
                >
                  {label}
                  <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold rounded-full ${
                    isActive ? 'bg-black/10' : 'bg-white/80 shadow-sm'
                  }`}>
                    {count === null
                      ? <span className="inline-block w-4 h-2 rounded animate-pulse bg-current opacity-40" />
                      : count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
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
                      className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 overflow-hidden hover:shadow-md transition-shadow ${
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
                          Q{booking.totalPrice.toLocaleString('es-GT')}
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
                            onClick={() => handleAccept(booking.id)}
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
                            onClick={() => handleDecline(booking.id)}
                            disabled={processingBookingId === booking.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-lg border-2 border-red-500 hover:bg-red-50 active:scale-95 transition-all disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
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
      </main>
    </div>
  );
}
