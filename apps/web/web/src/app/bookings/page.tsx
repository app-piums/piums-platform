'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { Booking } from '@piums/sdk';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { ModifyDateModal } from '@/components/bookings/ModifyDateModal';
import { ReviewModal } from '@/components/bookings/ReviewModal';
import { BookingStatusTimeline } from '@/components/bookings/BookingStatusTimeline';

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [modifyDateModalOpen, setModifyDateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated, activeTab]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Build filters based on active tab
      const filters: any = {};
      
      if (activeTab === 'active') {
        filters.status = 'PENDING,CONFIRMED,IN_PROGRESS';
      } else if (activeTab === 'completed') {
        filters.status = 'COMPLETED';
      } else if (activeTab === 'cancelled') {
        filters.status = 'CANCELLED';
      }

      const result = await sdk.listBookings(filters);
      setBookings(result.bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback to empty array on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      await sdk.cancelBooking(bookingId, reason);
      await loadBookings(); // Reload bookings
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const handleModifyDate = async (bookingId: string, newDate: string) => {
    try {
      await sdk.updateBookingDate(bookingId, newDate);
      await loadBookings(); // Reload bookings
    } catch (error) {
      console.error('Error modifying booking date:', error);
      throw error;
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedBooking) return;
    
    try {
      await sdk.createReview({
        bookingId: selectedBooking.id,
        rating,
        comment,
      });
      alert('¡Gracias por tu reseña!');
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const openModifyDateModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setModifyDateModalOpen(true);
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (booking.code && booking.code.toLowerCase().includes(query)) ||
        booking.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getCountdown = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `Faltan ${days} día${days > 1 ? 's' : ''} ${hours}h`;
    } else if (hours > 0) {
      return `Faltan ${hours} hora${hours > 1 ? 's' : ''} ${minutes}m`;
    } else {
      return `Faltan ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info', label: string }> = {
      PENDING: { variant: 'warning', label: 'Pendiente' },
      CONFIRMED: { variant: 'success', label: 'Confirmada' },
      IN_PROGRESS: { variant: 'info', label: 'En Progreso' },
      COMPLETED: { variant: 'success', label: 'Completada' },
      CANCELLED: { variant: 'danger', label: 'Cancelada' },
    };
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div>
        <Navbar />
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mis Reservas' }
          ]}
          className="mb-6"
        />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <Button onClick={() => router.push('/artists')}>
            Nueva Reserva
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' && 'Todas'}
                {tab === 'active' && 'Activas'}
                {tab === 'completed' && 'Completadas'}
                {tab === 'cancelled' && 'Canceladas'}
              </button>
            ))}
          </nav>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar reserva
            </label>
            <input
              type="text"
              id="search"
              placeholder="Código de reserva o ID..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay reservas</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery
                ? 'No se encontraron reservas con ese criterio de búsqueda.'
                : activeTab === 'all'
                ? 'Aún no tienes reservas. ¡Encuentra artistas increíbles!'
                : `No tienes reservas ${activeTab === 'active' ? 'activas' : activeTab === 'completed' ? 'completadas' : 'canceladas'}.`}
            </p>
            <Button onClick={() => router.push('/artists')} className="mt-4">
              Explorar Artistas
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const countdown = getCountdown(booking.scheduledDate);
              const isUpcoming = new Date(booking.scheduledDate) > new Date();
              const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
              const canModify = ['PENDING', 'CONFIRMED'].includes(booking.status);
              const canReview = booking.status === 'COMPLETED';

              return (
                <Card key={booking.id} hover>
                  <CardContent>
                    {/* Countdown Banner for upcoming active bookings */}
                    {isUpcoming && ['CONFIRMED', 'IN_PROGRESS'].includes(booking.status) && countdown && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-blue-400 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-sm font-medium text-blue-700">{countdown}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Artist Avatar - Mock */}
                        <Avatar fallback="A" size="lg" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Artista #{booking.artistId.slice(-3)}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            Código de reserva: <span className="font-mono text-blue-600">{booking.code || 'N/A'}</span>
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {new Date(booking.scheduledDate).toLocaleDateString('es-MX', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {new Date(booking.scheduledDate).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Status Timeline */}
                          <BookingStatusTimeline
                            status={booking.status}
                            createdAt={booking.createdAt}
                            confirmedAt={undefined}
                            completedAt={undefined}
                            cancelledAt={undefined}
                          />
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end space-y-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${booking.totalPrice.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">{booking.currency}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/bookings/${booking.id}`)}
                            className="w-full"
                          >
                            Ver Detalles
                          </Button>
                          
                          {canModify && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openModifyDateModal(booking)}
                              className="w-full"
                            >
                              Modificar Fecha
                            </Button>
                          )}
                          
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openCancelModal(booking)}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancelar Reserva
                            </Button>
                          )}
                          
                          {canReview && (
                            <Button
                              size="sm"
                              onClick={() => openReviewModal(booking)}
                              className="w-full"
                            >
                              Dejar Reseña
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBooking && (
        <>
          <CancelBookingModal
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            bookingCode={selectedBooking.code || 'N/A'}
            onConfirm={(reason) => handleCancelBooking(selectedBooking.id, reason)}
          />
          
          <ModifyDateModal
            isOpen={modifyDateModalOpen}
            onClose={() => setModifyDateModalOpen(false)}
            bookingCode={selectedBooking.code || 'N/A'}
            currentDate={selectedBooking.scheduledDate}
            onConfirm={(newDate) => handleModifyDate(selectedBooking.id, newDate)}
          />

          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            artistName={`Artista #${selectedBooking.artistId.slice(-3)}`}
            bookingCode={selectedBooking.code || 'N/A'}
            onSubmit={handleSubmitReview}
          />
        </>
      )}
      
      <Footer />
    </div>
  );
}
