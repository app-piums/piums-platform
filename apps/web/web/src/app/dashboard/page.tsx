'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface DashboardStats {
  bookingsCount: number;
  activeBookings: number;
  completedBookings: number;
  favoritesCount: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'review' | 'favorite';
  title: string;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    bookingsCount: 0,
    activeBookings: 0,
    completedBookings: 0,
    favoritesCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      // TODO: Implementar llamadas reales al API
      // Por ahora mostramos datos de ejemplo adaptados al rol
      setTimeout(() => {
        if (user?.role === 'artista') {
          // Datos para artistas
          setStats({
            bookingsCount: 12, // Total de reservas recibidas
            activeBookings: 3, // Reservas activas
            completedBookings: 9, // Reservas completadas
            favoritesCount: 24, // Clientes que te favoritearon
          });
          setRecentActivity([
            {
              id: '1',
              type: 'booking',
              title: 'Nueva solicitud de reserva',
              description: 'Juan Pérez solicitó una reserva para el 25 de febrero',
              date: '2026-02-20',
            },
            {
              id: '2',
              type: 'review',
              title: 'Nueva reseña recibida',
              description: 'María García dejó una reseña de 5 estrellas',
              date: '2026-02-19',
            },
            {
              id: '3',
              type: 'favorite',
              title: 'Nuevo seguidor',
              description: 'Carlos López agregó tu perfil a favoritos',
              date: '2026-02-18',
            },
          ]);
        } else {
          // Datos para clientes
          setStats({
            bookingsCount: 5,
            activeBookings: 2,
            completedBookings: 3,
            favoritesCount: 8,
          });
          setRecentActivity([
            {
              id: '1',
              type: 'booking',
              title: 'Nueva reserva confirmada',
              description: 'Tu reserva con María García ha sido confirmada',
              date: '2026-02-20',
            },
            {
              id: '2',
              type: 'review',
              title: 'Nueva reseña recibida',
              description: 'Juan Pérez dejó una reseña de 5 estrellas',
              date: '2026-02-19',
            },
            {
              id: '3',
              type: 'favorite',
              title: 'Artista agregado a favoritos',
              description: 'Agregaste a Carlos López a tus favoritos',
              date: '2026-02-18',
            },
          ]);
        }
        setLoadingData(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoadingData(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <Loading fullScreen />;
  }

  if (loadingData) {
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
            { label: 'Dashboard' }
          ]}
          className="mb-6"
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user?.nombre}
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'artista' 
                  ? 'Panel de control para gestionar tus servicios y reservas'
                  : 'Aquí tienes un resumen de tu actividad en Piums'}
              </p>
            </div>
            {user?.role && (
              <Badge variant={user.role === 'artista' ? 'purple' : 'blue'}>
                {user.role === 'artista' ? '🎵 Artista' : '👤 Cliente'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {user?.role === 'artista' ? 'Reservas Recibidas' : 'Reservas Totales'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.bookingsCount}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {user?.role === 'artista' ? 'Pendientes' : 'Activas'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBookings}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedBookings}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {user?.role === 'artista' ? 'Seguidores' : 'Favoritos'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.favoritesCount}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardTitle className="mb-4">Actividad Reciente</CardTitle>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'booking' ? 'bg-blue-100' :
                        activity.type === 'review' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {activity.type === 'booking' && (
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {activity.type === 'review' && (
                          <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                        {activity.type === 'favorite' && (
                          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardTitle className="mb-4">Acciones Rápidas</CardTitle>
              <CardContent>
                <div className="space-y-3">
                  {user?.role === 'artista' ? (
                    <>
                      <Link href="/profile">
                        <Button fullWidth variant="primary">
                          Editar Mi Perfil Artístico
                        </Button>
                      </Link>
                      <Link href="/bookings">
                        <Button fullWidth variant="outline">
                          Ver Solicitudes
                        </Button>
                      </Link>
                      <Button fullWidth variant="ghost">
                        Gestionar Servicios
                      </Button>
                      <Button fullWidth variant="ghost">
                        Configurar Disponibilidad
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/artists">
                        <Button fullWidth variant="primary">
                          Buscar Artistas
                        </Button>
                      </Link>
                      <Link href="/bookings">
                        <Button fullWidth variant="outline">
                          Ver Mis Reservas
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button fullWidth variant="ghost">
                          Editar Perfil
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="mt-6">
              <CardContent>
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Consejo del día</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {user?.role === 'artista' 
                        ? '💡 Completa tu perfil con fotos y reseñas para atraer más clientes'
                        : '💡 ¿Sabías que puedes guardar artistas en favoritos para encontrarlos más rápido?'}
      <Footer />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
