'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, ArtistProfile } from '@/../../packages/sdk/src';

export default function ArtistSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    bio: '',
    ciudad: '',
    experienceYears: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const artistProfile = await sdk.getArtistProfile();
      setArtist(artistProfile);

      setFormData({
        nombre: artistProfile.nombre || '',
        email: artistProfile.email || '',
        bio: artistProfile.bio || '',
        ciudad: artistProfile.ciudad || '',
        experienceYears: artistProfile.experienceYears || 0,
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Error al cargar el perfil');
      
      if (err.message?.includes('No autenticado') || err.message?.includes('401')) {
        router.push('/login?redirect=/artist/dashboard/settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await sdk.updateArtistProfile(formData);
      alert('Perfil actualizado exitosamente');
      
      // Recargar el perfil
      await loadProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: '👤' },
    { id: 'profile', label: 'Perfil Público', icon: '📝' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'payments', label: 'Pagos', icon: '💳' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando configuración...</p>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
            <p className="text-gray-600">Administra tu perfil y preferencias</p>
          </div>

          {/* Settings Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors relative flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? 'text-purple-700 border-b-2 border-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Datos Personales</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Años de experiencia
                    </label>
                    <input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Cuéntanos sobre ti y tu experiencia..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={loadProfile}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Perfil Público
                </h3>
                <p className="text-gray-600">
                  Configura cómo apareces en el catálogo de artistas
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  (Próximamente: foto de perfil, portada, portfolio, certificaciones)
                </p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Notificaciones
                </h3>
                <p className="text-gray-600">
                  Configura tus preferencias de notificaciones
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  (Próximamente: email, push, preferencias por tipo de evento)
                </p>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Métodos de Pago
                </h3>
                <p className="text-gray-600">
                  Administra tus cuentas bancarias y métodos de cobro
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  (Próximamente: Stripe Connect, cuentas bancarias, historial de pagos)
                </p>
              </div>
            )}
          </div>

          {/* Artist ID Info (for developers) */}
          {artist && (
            <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs text-gray-600 font-mono">
              <p>Artist ID: {artist.id}</p>
              <p>User ID: {artist.userId || 'N/A'}</p>
              <p>Slug: {artist.slug || 'N/A'}</p>
              <p>Verified: {artist.isVerified ? '✓' : '✗'}</p>
              <p>Active: {artist.isActive ? '✓' : '✗'}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
