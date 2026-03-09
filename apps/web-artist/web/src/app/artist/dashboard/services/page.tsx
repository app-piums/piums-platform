'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, Service } from '@/../../packages/sdk/src';

export default function ArtistServicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero obtener el perfil del artista para obtener su ID
      const artistProfile = await sdk.getArtistProfile();
      setArtistId(artistProfile.id);

      // Luego cargar sus servicios
      const artistServices = await sdk.getArtistServices(artistProfile.id);
      setServices(artistServices);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError(err.message || 'Error al cargar los servicios');
      
      if (err.message?.includes('No autenticado') || err.message?.includes('401')) {
        router.push('/login?redirect=/artist/dashboard/services');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Servicios</h1>
              <p className="text-gray-600">Administra y edita los servicios que ofreces</p>
            </div>
            
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              + Nuevo Servicio
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando servicios...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadServices}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Services List */}
          {!isLoading && !error && (
            <>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            service.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {service.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Precio base</p>
                          <p className="text-xl font-bold text-gray-900">${service.basePrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duración</p>
                          <p className="text-xl font-bold text-gray-900">{service.duration} min</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm">
                          ✏️ Editar
                        </button>
                        <button
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                            service.isActive
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {service.isActive ? '⏸ Desactivar' : '▶ Activar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes servicios registrados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primer servicio
                  </p>
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    + Crear mi primer servicio
                  </button>
                </div>
              )}
            </>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Gestión de Servicios</h3>
            <p className="text-blue-800 text-sm">
              Los servicios activos son los que aparecen en tu perfil público y están disponibles para reserva.
              Los servicios inactivos permanecen guardados pero no son visibles para los clientes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
