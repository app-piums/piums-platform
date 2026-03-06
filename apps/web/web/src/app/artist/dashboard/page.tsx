'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { StatsCards } from '@/components/artist/StatsCards';
import { sdk, Booking } from '@/../../packages/sdk/src';

export default function ArtistDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const statsData = await sdk.getArtistStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
      
      // Si no está autenticado, redirigir al login
      if (err.message?.includes('No autenticado') || err.message?.includes('401')) {
        router.push('/login?redirect=/artist/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista General</h1>
            <p className="text-gray-600">Resumen de tu actividad y estadísticas</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <StatsCards
              bookingsThisMonth={stats.bookings.thisMonth}
              totalRevenue={stats.revenue.total}
              averageRating={stats.rating.average}
              totalReviews={stats.rating.totalReviews}
              pendingBookings={stats.bookings.pending}
              confirmedBookings={stats.bookings.confirmed}
            />
          )}

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Próximas Reservas</h2>
              <button
                onClick={() => router.push('/artist/dashboard/bookings')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Ver todas →
              </button>
            </div>

            {stats?.upcomingBookings && stats.upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingBookings.slice(0, 5).map((booking: Booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Código: {booking.code}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.scheduledDate).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${booking.totalPrice.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{booking.currency}</p>
                      </div>
                      
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-600 mb-2">No hay reservas próximas</p>
                <p className="text-sm text-gray-500">Las reservas confirmadas aparecerán aquí</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <button
              onClick={() => router.push('/artist/dashboard/bookings')}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all text-left group"
            >
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700">
                Ver Reservas
              </h3>
              <p className="text-sm text-gray-600">
                Gestiona tus reservas pendientes y confirmadas
              </p>
            </button>

            <button
              onClick={() => router.push('/artist/dashboard/calendar')}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all text-left group"
            >
              <div className="text-3xl mb-3">🗓️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700">
                Calendario
              </h3>
              <p className="text-sm text-gray-600">
                Administra tu disponibilidad y bloquea fechas
              </p>
            </button>

            <button
              onClick={() => router.push('/artist/dashboard/services')}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all text-left group"
            >
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700">
                Mis Servicios
              </h3>
              <p className="text-sm text-gray-600">
                Administra y edita tus servicios ofrecidos
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
