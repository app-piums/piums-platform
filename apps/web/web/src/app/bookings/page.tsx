'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { Booking } from '@piums/sdk';

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // const result = await sdk.getBookings();
      // setBookings(result.data);

      // Mock data
      const mockBookings: Booking[] = [
        {
          id: '1',
          code: 'BK-2026-001',
          userId: 'user-1',
          artistId: 'artist-1',
          status: 'CONFIRMED',
          scheduledAt: '2026-03-15T10:00:00Z',
          totalAmount: 15000,
          currency: 'MXN',
          createdAt: '2026-02-20T10:00:00Z',
        },
        {
          id: '2',
          code: 'BK-2026-002',
          userId: 'user-1',
          artistId: 'artist-2',
          status: 'PENDING',
          scheduledAt: '2026-03-20T14:00:00Z',
          totalAmount: 10000,
          currency: 'MXN',
          createdAt: '2026-02-21T10:00:00Z',
        },
        {
          id: '3',
          code: 'BK-2026-003',
          userId: 'user-1',
          artistId: 'artist-3',
          status: 'COMPLETED',
          scheduledAt: '2026-02-10T16:00:00Z',
          totalAmount: 8000,
          currency: 'MXN',
          createdAt: '2026-02-05T10:00:00Z',
        },
      ];

      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status);
    if (activeTab === 'completed') return booking.status === 'COMPLETED';
    if (activeTab === 'cancelled') return booking.status === 'CANCELLED';
    return true;
  });

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

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay reservas</h3>
            <p className="mt-1 text-gray-500">
              {activeTab === 'all'
                ? 'Aún no tienes reservas. ¡Encuentra artistas increíbles!'
                : `No tienes reservas ${activeTab === 'active' ? 'activas' : activeTab === 'completed' ? 'completadas' : 'canceladas'}.`}
            </p>
            <Button onClick={() => router.push('/artists')} className="mt-4">
              Explorar Artistas
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} hover>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
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
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Código de reserva: <span className="font-mono text-blue-600">{booking.code}</span>
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {new Date(booking.scheduledAt).toLocaleDateString('es-MX', {
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
                              {new Date(booking.scheduledAt).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${booking.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">{booking.currency}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        >
                          Ver Detalles
                        </Button>
                        
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                                // Handle cancellation
                                alert('Funcionalidad de cancelación en desarrollo');
                              }
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                        
                        {booking.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/artists/${booking.artistId}?review=true`)}
                          >
                            Dejar Reseña
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
