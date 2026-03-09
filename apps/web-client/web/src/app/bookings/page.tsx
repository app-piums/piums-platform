'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { BookingCard } from '@/components/booking/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { Booking } from '@piums/sdk';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { ModifyDateModal } from '@/components/bookings/ModifyDateModal';
import { ReviewModal } from '@/components/bookings/ReviewModal';

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

  // Transform booking to BookingCard format
  const transformBooking = (booking: Booking) => ({
    id: booking.id,
    code: booking.code || 'N/A',
    status: booking.status.toLowerCase() as 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rejected',
    artist: {
      name: `Artista #${booking.artistId.slice(-3)}`,
      avatar: undefined, // Will use fallback
      rating: undefined,
    },
    date: booking.scheduledDate,
    time: new Date(booking.scheduledDate).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    location: 'Por definir',
    duration: 'Por definir',
    amount: booking.totalPrice,
    currency: booking.currency,
  });

  if (authLoading) {
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
            <p className="mt-1 text-gray-600">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'reserva' : 'reservas'} 
              {activeTab !== 'all' && ` ${
                activeTab === 'active' ? 'activas' : 
                activeTab === 'completed' ? 'completadas' : 
                'canceladas'
              }`}
            </p>
          </div>
          <Button onClick={() => router.push('/artists')}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Reserva
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por código de reserva o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            className="max-w-md"
          />
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { 
              id: 'all', 
              label: 'Todas',
              count: bookings.length,
            },
            { 
              id: 'active', 
              label: 'Activas',
              count: bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
            },
            { 
              id: 'completed', 
              label: 'Completadas',
              count: bookings.filter(b => b.status === 'COMPLETED').length,
            },
            { 
              id: 'cancelled', 
              label: 'Canceladas',
              count: bookings.filter(b => b.status === 'CANCELLED').length,
            },
          ]}
          defaultTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'all' | 'active' | 'completed' | 'cancelled')}
          variant="line"
        />

        {/* Tab Content */}
        <TabPanel id={activeTab} activeTab={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron reservas' : 'No hay reservas'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'No se encontraron reservas con ese criterio de búsqueda. Intenta con otro término.'
                  : activeTab === 'all'
                  ? 'Aún no tienes reservas. ¡Encuentra artistas increíbles y comienza a reservar!'
                  : `No tienes reservas ${
                      activeTab === 'active' ? 'activas' : 
                      activeTab === 'completed' ? 'completadas' : 
                      'canceladas'
                    } en este momento.`}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/artist')}>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar Artistas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
                const canReview = booking.status === 'COMPLETED';
                
                const actions = [];
                
                // View Details button
                actions.push({
                  label: 'Ver Detalles',
                  onClick: () => router.push(`/bookings/${booking.id}`),
                  variant: 'outline' as const,
                });
                
                // Confirm button (only for pending)
                if (booking.status === 'PENDING') {
                  actions.push({
                    label: 'Confirmar',
                    onClick: () => alert('Próximamente - Confirmar reserva'),
                    variant: 'primary' as const,
                  });
                }
                
                // Cancel button
                if (canCancel) {
                  actions.push({
                    label: 'Cancelar',
                    onClick: () => openCancelModal(booking),
                    variant: 'ghost' as const,
                  });
                }
                
                // Review button
                if (canReview) {
                  actions.push({
                    label: 'Dejar Reseña',
                    onClick: () => openReviewModal(booking),
                    variant: 'primary' as const,
                  });
                }

                return (
                  <BookingCard
                    key={booking.id}
                    {...transformBooking(booking)}
                    actions={actions}
                  />
                );
              })}
            </div>
          )}
        </TabPanel>
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
