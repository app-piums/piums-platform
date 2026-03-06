'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { BookingTimeline } from '@/components/dashboard/BookingTimeline';

interface DashboardStats {
  bookingsCount: number;
  activeBookings: number;
  completedBookings: number;
  favoritesCount: number;
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
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados para la búsqueda de artistas (solo clientes)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

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
        } else {
          // Datos para clientes
          setStats({
            bookingsCount: 5,
            activeBookings: 2,
            completedBookings: 3,
            favoritesCount: 8,
          });
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
              <Badge variant={user.role === 'artista' ? 'primary' : 'accent'}>
                {user.role === 'artista' ? '🎵 Artista' : '👤 Cliente'}
              </Badge>
            )}
          </div>
          
          {/* Barra de búsqueda para clientes */}
          {user?.role === 'cliente' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  if (searchQuery) params.set('q', searchQuery);
                  if (selectedCategory) params.set('category', selectedCategory);
                  if (selectedCity) params.set('location', selectedCity);
                  router.push(`/artists?${params.toString()}`);
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <Input
                  placeholder="Buscar artistas por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                
                <Select
                  options={[
                    { value: '', label: 'Todas las categorías' },
                    { value: 'musica', label: 'Música' },
                    { value: 'fotografia', label: 'Fotografía' },
                    { value: 'catering', label: 'Catering' },
                    { value: 'decoracion', label: 'Decoración' },
                    { value: 'animacion', label: 'Animación' },
                  ]}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                
                <Select
                  options={[
                    { value: '', label: 'Todas las ciudades' },
                    { value: '1', label: 'Ciudad de México' },
                    { value: '2', label: 'Guadalajara' },
                    { value: '3', label: 'Monterrey' },
                  ]}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                />
                
                <Button type="submit" fullWidth>
                  Buscar
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Stats Cards - Usando nuevo MetricsGrid */}
        <MetricsGrid
          metrics={[
            {
              id: 'bookings',
              title: user?.role === 'artista' ? 'Reservas Recibidas' : 'Reservas Totales',
              value: stats.bookingsCount,
              trend: {
                value: 12,
                label: 'vs mes anterior',
                direction: 'up'
              },
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              variant: 'accent',
            },
            {
              id: 'active',
              title: user?.role === 'artista' ? 'Pendientes' : 'Activas',
              value: stats.activeBookings,
              trend: {
                value: 5,
                label: 'vs semana anterior',
                direction: 'up'
              },
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              variant: 'success',
            },
            {
              id: 'completed',
              title: 'Completadas',
              value: stats.completedBookings,
              progress: {
                value: stats.completedBookings,
                max: stats.bookingsCount,
                variant: 'primary'
              },
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ),
              variant: 'primary',
            },
            {
              id: 'favorites',
              title: user?.role === 'artista' ? 'Seguidores' : 'Favoritos',
              value: stats.favoritesCount,
              subtitle: user?.role === 'artista' ? 'clientes te siguen' : 'artistas guardados',
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ),
              variant: 'warning',
            },
          ]}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity / Booking Timeline */}
          <div className="lg:col-span-2">
            <BookingTimeline
              events={[
                {
                  id: '1',
                  title: 'Boda María & Carlos',
                  date: '2026-03-15',
                  time: '18:00',
                  status: 'confirmed',
                  artist: user?.role === 'cliente' ? 'Juan Pérez Band' : undefined,
                  client: user?.role === 'artista' ? 'María García' : undefined,
                  amount:8500,
                },
                {
                  id: '2',
                  title: 'Evento Corporativo',
                  date: '2026-03-18',
                  time: '15:00',
                  status: 'pending',
                  artist: user?.role === 'cliente' ? 'Los Fotógrafos Pro' : undefined,
                  client: user?.role === 'artista' ? 'Tech Corp SA' : undefined,
                  amount: 12000,
                },
                {
                  id: '3',
                  title: 'Fiesta XV Años',
                  date: '2026-03-22',
                  time: '19:00',
                  status: 'confirmed',
                  artist: user?.role === 'cliente' ? 'DJ Alex Sounds' : undefined,
                  client: user?.role === 'artista' ? 'Ana López' : undefined,
                  amount: 6500,
                },
              ]}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions
              actions={
                user?.role === 'artista'
                  ? [
                      {
                        id: 'profile',
                        title: 'Editar Perfil',
                        description: 'Actualiza tu información y portafolio',
                        href: '/profile',
                        variant: 'primary',
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ),
                      },
                      {
                        id: 'bookings',
                        title: 'Ver Solicitudes',
                        description: 'Gestiona tus reservas pendientes',
                        href: '/bookings',
                        variant: 'success',
                        badge: `${stats.activeBookings} nuevas`,
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        ),
                      },
                      {
                        id: 'services',
                        title: 'Mis Servicios',
                        description: 'Administra tus servicios y precios',
                        onClick: () => alert('Próximamente'),
                        variant: 'default',
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        ),
                      },
                    ]
                  : [
                      {
                        id: 'bookings',
                        title: 'Mis Reservas',
                        description: 'Ver todas mis reservas activas',
                        href: '/bookings',
                        variant: 'primary',
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ),
                      },
                      {
                        id: 'profile',
                        title: 'Mi Perfil',
                        description: 'Actualiza tu información personal',
                        href: '/profile',
                        variant: 'default',
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ),
                      },
                      {
                        id: 'artists',
                        title: 'Explorar Artistas',
                        description: 'Descubre nuevos profesionales',
                        href: '/artists',
                        variant: 'success',
                        icon: (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        ),
                      },
                    ]
              }
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
