'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, ArtistProfile } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';
import { LocationPickerMap } from '@/components/LocationPickerMap';

type ArtistFormData = {
  nombre: string;
  email: string;
  bio: string;
  ciudad: string;
  experienceYears: number;
  baseLocationLabel: string;
  baseLocationLat: number | null;
  baseLocationLng: number | null;
};

export default function ArtistSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ArtistFormData>({
    nombre: '',
    email: '',
    bio: '',
    ciudad: '',
    experienceYears: 0,
    baseLocationLabel: '',
    baseLocationLat: null,
    baseLocationLng: null,
  });

  // Cobertura / pricing state
  const [coverageData, setCoverageData] = useState({
    coverageRadius: 10,
    hourlyRateMin: 0,
    hourlyRateMax: 0,
    requiresDeposit: false,
    depositPercentage: 30,
  });
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
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
        baseLocationLabel: artistProfile.baseLocationLabel || '',
        baseLocationLat: artistProfile.baseLocationLat ?? null,
        baseLocationLng: artistProfile.baseLocationLng ?? null,
      });
      setCoverageData({
        coverageRadius: artistProfile.coverageRadius ?? 10,
        hourlyRateMin: artistProfile.hourlyRateMin ?? 0,
        hourlyRateMax: artistProfile.hourlyRateMax ?? 0,
        requiresDeposit: artistProfile.requiresDeposit ?? false,
        depositPercentage: artistProfile.depositPercentage ?? 30,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading profile:', message);
      setError(message || 'Error al cargar el perfil');
      
      if (isUnauthorizedError(err)) {
        router.push('/login?redirect=/artist/dashboard/settings');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload: Partial<ArtistProfile> = {
        ...formData,
        baseLocationLabel: formData.baseLocationLabel.trim() || undefined,
        baseLocationLat: formData.baseLocationLat ?? undefined,
        baseLocationLng: formData.baseLocationLng ?? undefined,
      };

      await sdk.updateArtistProfile(payload);
      alert('Perfil actualizado exitosamente');
      
      // Recargar el perfil
      await loadProfile();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error updating profile:', message);
      alert(message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCoverage = async () => {
    try {
      setIsSavingCoverage(true);
      await sdk.updateArtistProfile(coverageData);
      alert('Configuración de cobertura actualizada');
    } catch (err: unknown) {
      alert(getErrorMessage(err) || 'Error al guardar');
    } finally {
      setIsSavingCoverage(false);
    }
  };

  const handleCoordinateChange = (key: 'baseLocationLat' | 'baseLocationLng', value: string) => {
    setFormData((prev) => {
      if (value === '') {
        return { ...prev, [key]: null };
      }
      const parsed = parseFloat(value);
      if (Number.isNaN(parsed)) {
        return prev;
      }
      return { ...prev, [key]: parsed };
    });
    if (locationError) {
      setLocationError(null);
    }
  };

  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Tu navegador no permite detectar la ubicación automáticamente.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          baseLocationLat: latitude,
          baseLocationLng: longitude,
          baseLocationLabel:
            prev.baseLocationLabel || `Coordenadas ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        setIsDetectingLocation(false);
      },
      (error: GeolocationPositionError) => {
        const errorMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Necesitamos permiso para detectar tu ubicación automáticamente.'
            : 'No pudimos obtener tu ubicación. Intenta de nuevo o ingrésala manualmente.';
        setLocationError(errorMessage);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleClearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      baseLocationLabel: '',
      baseLocationLat: null,
      baseLocationLng: null,
    }));
    setLocationError(null);
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      baseLocationLat: lat,
      baseLocationLng: lng,
      baseLocationLabel:
        prev.baseLocationLabel || `Coordenadas ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    }));
    setLocationError(null);
  };

  const RADIUS_PRESETS = [5, 10, 20, 30, 50, 75, 100];

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: '👤' },
    { id: 'coverage', label: 'Cobertura', icon: '📍' },
    { id: 'profile', label: 'Perfil Público', icon: '📝' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'payments', label: 'Pagos', icon: '💳' },
  ];

  const hasBaseLocation = formData.baseLocationLat !== null && formData.baseLocationLng !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 pt-20 sm:p-8 lg:pt-8">
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
      
      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Configuración</h1>
            <p className="text-gray-500 text-sm">Administra tu perfil y preferencias</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Settings Tabs - scrollable on mobile */}
          <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 shrink-0
                  ${
                    activeTab === tab.id
                      ? 'text-orange-600 border-b-2 border-orange-600'
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

                <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Ubicación base</h3>
                      <p className="text-sm text-gray-600">
                        Este punto se usa como referencia para calcular distancias y costos de traslado.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-60"
                      >
                        {isDetectingLocation ? 'Detectando...' : 'Detectar automáticamente'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        disabled={!hasBaseLocation && !formData.baseLocationLabel}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referencia o descripción
                      </label>
                      <input
                        type="text"
                        value={formData.baseLocationLabel}
                        onChange={(e) => {
                          setFormData({ ...formData, baseLocationLabel: e.target.value });
                          if (locationError) setLocationError(null);
                        }}
                        placeholder="Zona 10, Ciudad de Guatemala"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Puedes escribir la colonia, zona o referencia que mejor describa tu punto base.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitud</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={formData.baseLocationLat ?? ''}
                          onChange={(e) => handleCoordinateChange('baseLocationLat', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="14.6349"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitud</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={formData.baseLocationLng ?? ''}
                          onChange={(e) => handleCoordinateChange('baseLocationLng', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="-90.5069"
                        />
                      </div>
                    </div>

                    {locationError && (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {locationError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Selecciona en el mapa
                      </p>
                      <LocationPickerMap
                        latitude={formData.baseLocationLat}
                        longitude={formData.baseLocationLng}
                        onSelect={handleMapSelect}
                      />
                      <p className="text-xs text-gray-500">
                        Arrastra el mapa y haz clic para colocar el pin exactamente donde te ubicas. Puedes ajustar los valores manualmente si lo prefieres.
                      </p>
                    </div>

                    {hasBaseLocation && (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        Guardaremos estas coordenadas para calcular automáticamente los costos de traslado.
                      </p>
                    )}
                  </div>
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

            {activeTab === 'coverage' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Cobertura y Traslado</h2>
                  <p className="text-sm text-gray-500">Define hasta dónde llegas sin cobrar traslado adicional. Esto se usa para calcular el precio final al cliente.</p>
                </div>

                {/* Coverage radius */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Zona de cobertura sin costo</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Dentro de <span className="font-bold text-orange-600">{coverageData.coverageRadius} km</span> desde tu ciudad base, el traslado es gratuito para el cliente.
                      </p>
                    </div>
                  </div>

                  {/* Visual ring representation */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative" style={{ width: 200, height: 200 }}>
                      {/* Outer dashed ring (max) */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300" />
                      {/* Coverage ring */}
                      <div
                        className="absolute rounded-full bg-orange-100 border-2 border-orange-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (coverageData.coverageRadius / 100) * 100)}%`,
                          height: `${Math.min(100, (coverageData.coverageRadius / 100) * 100)}%`,
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      {/* Center dot */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full z-10" />
                      {/* Label */}
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-xs text-gray-500">Tu ciudad</span>
                      </div>
                      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full pl-2">
                        <span className="text-xs font-medium text-orange-600">{coverageData.coverageRadius} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min={1}
                      max={200}
                      value={coverageData.coverageRadius}
                      onChange={(e) => setCoverageData({ ...coverageData, coverageRadius: parseInt(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 km</span>
                      <span>200 km</span>
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2">
                    {RADIUS_PRESETS.map((km) => (
                      <button
                        key={km}
                        onClick={() => setCoverageData({ ...coverageData, coverageRadius: km })}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          coverageData.coverageRadius === km
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                    <button
                      onClick={() => setCoverageData({ ...coverageData, coverageRadius: 999 })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        !RADIUS_PRESETS.includes(coverageData.coverageRadius) && coverageData.coverageRadius >= 200
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                      }`}
                    >
                      Sin límite
                    </button>
                  </div>
                </div>

                {/* Pricing section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                  <h3 className="font-semibold text-gray-900">Precio de traslado y tarifas</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio mínimo por hora (Q)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          value={coverageData.hourlyRateMin}
                          onChange={(e) => setCoverageData({ ...coverageData, hourlyRateMin: parseInt(e.target.value) || 0 })}
                          className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio máximo por hora (Q)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min={0}
                          value={coverageData.hourlyRateMax}
                          onChange={(e) => setCoverageData({ ...coverageData, hourlyRateMax: parseInt(e.target.value) || 0 })}
                          className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        id="requires-deposit"
                        type="checkbox"
                        checked={coverageData.requiresDeposit}
                        onChange={(e) => setCoverageData({ ...coverageData, requiresDeposit: e.target.checked })}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <label htmlFor="requires-deposit" className="text-sm font-medium text-gray-700">
                        Requiere anticipo para confirmar reserva
                      </label>
                    </div>

                    {coverageData.requiresDeposit && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Porcentaje de anticipo
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={coverageData.depositPercentage}
                            onChange={(e) => setCoverageData({ ...coverageData, depositPercentage: parseInt(e.target.value) })}
                            className="flex-1 accent-purple-600"
                          />
                          <span className="w-12 text-center font-semibold text-purple-700">{coverageData.depositPercentage}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong>¿Cómo funciona?</strong> Cuando un cliente solicita tu servicio, el sistema calcula automáticamente si su ubicación está dentro de tu zona de cobertura. Si está fuera, se agrega un costo de traslado que se configura en cada servicio individual.
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSaveCoverage}
                    disabled={isSavingCoverage}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                  >
                    {isSavingCoverage ? 'Guardando...' : 'Guardar cobertura'}
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Perfil Público</h2>
                  <p className="text-sm text-gray-500">Así te ven los clientes en el catálogo. Mantén tu información actualizada para recibir más reservas.</p>
                </div>

                {/* Preview card */}
                {artist && (
                  <div className="bg-gradient-to-br from-orange-50 to-purple-50 border border-gray-200 rounded-xl p-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Vista previa</p>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                        {(artist.nombre || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{artist.nombre || 'Tu nombre'}</h3>
                          {artist.isVerified && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">✓ Verificado</span>
                          )}
                          {artist.isPremium && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⭐ Premium</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{artist.category || artist.categoria || 'Categoría'} · {artist.ciudad || 'Ciudad'}</p>
                        {artist.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{artist.bio}</p>}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {artist.rating !== undefined && (
                            <span>⭐ {artist.rating.toFixed(1)} ({artist.reviewsCount || 0} reseñas)</span>
                          )}
                          {artist.experienceYears ? <span>🏆 {artist.experienceYears} años de exp.</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Avatar / Photo section */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Foto de perfil</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
                      {(artist?.nombre || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Sube una foto profesional. Recomendamos mínimo 400×400px.</p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium">
                          📁 Subir foto
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover photo */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Foto de portada</h3>
                  {artist?.coverPhoto ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                      <Image
                        src={artist.coverPhoto}
                        alt="Foto de portada"
                        fill
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-orange-200 to-purple-200 rounded-lg flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-400 transition-colors">
                      <span>Haz clic para subir foto de portada (1200×400px recomendado)</span>
                    </div>
                  )}
                  <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium">
                    📁 Cambiar portada
                  </button>
                </div>

                {/* Category & specialties */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Categoría y especialidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría principal</label>
                      <input
                        type="text"
                        value={formData.ciudad}
                        readOnly
                        placeholder="Ej: Fotografía, Música, DJ..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">La categoría se configura durante el registro.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Slug / URL pública</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 shrink-0">piums.com/</span>
                        <input
                          type="text"
                          value={artist?.slug || ''}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong>💡 Consejo:</strong> Los artistas con foto de perfil y portada reciben hasta 3x más visitas en su perfil. ¡Complétalo!
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Notificaciones</h2>
                  <p className="text-sm text-gray-500">Elige cuándo y cómo quieres recibir avisos.</p>
                </div>

                {([
                  {
                    section: 'Reservas',
                    icon: '📅',
                    items: [
                      { id: 'booking_new', label: 'Nueva solicitud de reserva', desc: 'Cuando un cliente solicita tu servicio', defaultOn: true },
                      { id: 'booking_confirmed', label: 'Reserva confirmada', desc: 'Cuando una reserva es aceptada', defaultOn: true },
                      { id: 'booking_cancelled', label: 'Reserva cancelada', desc: 'Cuando un cliente cancela', defaultOn: true },
                      { id: 'booking_reminder', label: 'Recordatorio de evento', desc: '24 horas antes de tu próxima reserva', defaultOn: true },
                    ],
                  },
                  {
                    section: 'Pagos',
                    icon: '💰',
                    items: [
                      { id: 'payment_received', label: 'Pago recibido', desc: 'Cuando recibes un pago o anticipo', defaultOn: true },
                      { id: 'payment_pending', label: 'Pago pendiente', desc: 'Recordatorio de pagos no recibidos', defaultOn: false },
                    ],
                  },
                  {
                    section: 'Reseñas y mensajes',
                    icon: '⭐',
                    items: [
                      { id: 'review_new', label: 'Nueva reseña', desc: 'Cuando un cliente deja una valoración', defaultOn: true },
                      { id: 'message_new', label: 'Mensaje nuevo', desc: 'Cuando recibes un mensaje de un cliente', defaultOn: true },
                    ],
                  },
                  {
                    section: 'Marketing',
                    icon: '📣',
                    items: [
                      { id: 'promo_tips', label: 'Consejos para mejorar tu perfil', desc: 'Sugerencias para atraer más clientes', defaultOn: false },
                      { id: 'promo_news', label: 'Novedades de Piums', desc: 'Nuevas funciones y actualizaciones', defaultOn: false },
                    ],
                  },
                ] as { section: string; icon: string; items: { id: string; label: string; desc: string; defaultOn: boolean }[] }[]).map((group) => (
                  <div key={group.section} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 border-b border-gray-200">
                      <span>{group.icon}</span>
                      <span className="font-semibold text-gray-800 text-sm">{group.section}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                            <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-4 pt-2">
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                    Guardar preferencias
                  </button>
                </div>
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
