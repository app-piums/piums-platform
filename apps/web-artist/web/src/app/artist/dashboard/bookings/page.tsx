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

  useEffect(() => {
    loadBookings();
  }, [activeStatus, currentPage]);

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

  const handleAccept = async (bookingId: string) => {
    if (!confirm('¿Confirmar aceptar esta reserva?')) return;

    try {
      setProcessingBookingId(bookingId);
      await sdk.acceptBooking(bookingId);
      
      // Recargar las reservas
      await loadBookings();
      
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
      
      // Recargar las reservas
      await loadBookings();
      
      alert('Reserva rechazada');
    } catch (err: any) {
      console.error('Error declining booking:', err);
      alert(err.message || 'Error al rechazar la reserva');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const statusTabs: { label: string; value: BookingStatus; badge?: number }[] = [
    { label: 'Pendientes', value: 'PENDING', badge: activeStatus === 'PENDING' ? total : undefined },
    { label: 'Confirmadas', value: 'CONFIRMED' },
    { label: 'Completadas', value: 'COMPLETED' },
    { label: 'Canceladas', value: 'CANCELLED' },
    { label: 'Todas', value: 'ALL' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reservas</h1>
            <p className="text-gray-500 text-sm">Gestiona las reservas recibidas</p>
          </div>

          {/* Status Tabs - scrollable on mobile */}
          <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveStatus(tab.value);
                  setCurrentPage(1);
                }}
                className={`
                  whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors relative shrink-0
                  ${
                    activeStatus === tab.value
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando reservas...</p>
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
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Código: {booking.code || booking.id.slice(0, 8)}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : booking.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Fecha programada:</p>
                              <p className="font-medium text-gray-900">
                                {new Date(booking.scheduledDate).toLocaleDateString('es-MX', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-600">Duración:</p>
                              <p className="font-medium text-gray-900">{booking.durationMinutes} minutos</p>
                            </div>

                            <div>
                              <p className="text-gray-600">Ubicación:</p>
                              <p className="font-medium text-gray-900">{booking.location || 'No especificada'}</p>
                            </div>

                            <div>
                              <p className="text-gray-600">Precio total:</p>
                              <p className="font-bold text-gray-900">
                                Q{booking.totalPrice.toLocaleString('es-GT')}
                              </p>
                            </div>
                          </div>

                          {booking.clientNotes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600 uppercase font-medium mb-1">Notas del cliente:</p>
                              <p className="text-sm text-gray-800">{booking.clientNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {booking.status === 'PENDING' && (
                          <div className="flex sm:flex-col gap-2 sm:ml-4">
                            <button
                              onClick={() => handleAccept(booking.id)}
                              disabled={processingBookingId === booking.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {processingBookingId === booking.id ? 'Procesando...' : '✓ Aceptar'}
                            </button>
                            <button
                              onClick={() => handleDecline(booking.id)}
                              disabled={processingBookingId === booking.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {processingBookingId === booking.id ? 'Procesando...' : '✗ Rechazar'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay reservas</h3>
                  <p className="text-gray-600">
                    {activeStatus === 'PENDING'
                      ? 'No tienes reservas pendientes en este momento'
                      : `No hay reservas en estado ${activeStatus}`}
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
