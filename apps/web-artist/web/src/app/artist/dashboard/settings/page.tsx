'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { cImg } from '@/lib/cloudinaryImg';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, ArtistProfile } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError, isArtistNotFoundError } from '@/lib/errors';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, Star, Trophy, Lightbulb, CreditCard, CheckCircle } from 'lucide-react';

function LegalAccordion({ section }: { section: { id: string; title: string; icon: React.ReactNode; content: React.ReactNode } }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#FF6B35]">{section.icon}</span>
          <span className="font-semibold text-gray-900 text-sm">{section.title}</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed space-y-3 border-t border-gray-100">
          {section.content}
        </div>
      )}
    </div>
  );
}

const ARTIST_CATEGORIES: { value: string; label: string }[] = [
  { value: 'MUSICO',            label: 'Músico' },
  { value: 'FOTOGRAFO',         label: 'Fotógrafo' },
  { value: 'VIDEOGRAFO',        label: 'Videógrafo' },
  { value: 'ANIMADOR',          label: 'Animador' },
];

type ArtistFormData = {
  nombre: string;
  email: string;
  telefono: string;
  bio: string;
  ciudad: string;
  yearsExperience: number;
  baseLocationLabel: string;
  baseLocationLat: number | null;
  baseLocationLng: number | null;
  category: string;
  secondaryCategory: string;
};

export default function ArtistSettingsPage() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const currentTab = activeTab ?? 'personal';
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verification form state
  const [verifyData, setVerifyData] = useState({
    ciudad: '',
    birthDate: '',
    documentType: 'DPI' as 'DPI' | 'PASSPORT' | 'RESIDENCE_CARD',
    documentNumber: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    documentSelfieUrl: '',
  });
  const [verifyPreviews, setVerifyPreviews] = useState({ front: '', back: '', selfie: '' });
  const [verifyUploading, setVerifyUploading] = useState({ front: false, back: false, selfie: false });
  const [isSavingVerify, setIsSavingVerify] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ArtistFormData>({
    nombre: '',
    email: '',
    telefono: '',
    bio: '',
    ciudad: '',
    yearsExperience: 0,
    baseLocationLabel: '',
    baseLocationLat: null,
    baseLocationLng: null,
    category: '',
    secondaryCategory: '',
  });

  // Cobertura / pricing state
  const [coverageData, setCoverageData] = useState<{
    coverageRadius: number | null;
    hourlyRateMin: number;
    hourlyRateMax: number;
    requiresDeposit: boolean;
    depositPercentage: number;
  }>({
    coverageRadius: 10,
    hourlyRateMin: 0,
    hourlyRateMax: 0,
    requiresDeposit: false,
    depositPercentage: 30,
  });
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localCoverPhoto, setLocalCoverPhoto] = useState<string | null>(null);
  const [socialData, setSocialData] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    website: '',
  });
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Populate verification form from authUser
  useEffect(() => {
    if (authUser) {
      setVerifyData((prev) => ({
        ...prev,
        ciudad: authUser.ciudad || '',
        birthDate: authUser.birthDate
          ? new Date(authUser.birthDate).toISOString().split('T')[0]
          : '',
        documentType: (authUser.documentType as 'DPI' | 'PASSPORT' | 'RESIDENCE_CARD') || 'DPI',
        documentNumber: authUser.documentNumber || '',
        documentFrontUrl: authUser.documentFrontUrl || '',
        documentBackUrl: authUser.documentBackUrl || '',
        documentSelfieUrl: authUser.documentSelfieUrl || '',
      }));
      setVerifyPreviews({
        front: authUser.documentFrontUrl || '',
        back: authUser.documentBackUrl || '',
        selfie: authUser.documentSelfieUrl || '',
      });
    }
  }, [authUser]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [artistProfile] = await Promise.all([
        sdk.getArtistProfile(),
        // Fetch cover photo from users-service (not stored in artists-service)
        fetch('/api/users/me', { credentials: 'include' })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            const cover = data?.profile?.coverPhoto;
            if (cover) setLocalCoverPhoto(cover);
          })
          .catch(() => {}),
      ]);
      setArtist(artistProfile);

      setFormData({
        nombre: artistProfile.nombre || '',
        email: artistProfile.email || '',
        telefono: artistProfile.telefono || '',
        bio: artistProfile.bio || '',
        ciudad: artistProfile.ciudad || '',
        yearsExperience: artistProfile.yearsExperience || 0,
        baseLocationLabel: artistProfile.baseLocationLabel || '',
        baseLocationLat: artistProfile.baseLocationLat ?? null,
        baseLocationLng: artistProfile.baseLocationLng ?? null,
        category: artistProfile.category || '',
        secondaryCategory: artistProfile.specialties?.[0] || '',
      });
      setSocialData({
        instagram: artistProfile.instagram || '',
        facebook: artistProfile.facebook || '',
        youtube: artistProfile.youtube || '',
        tiktok: artistProfile.tiktok || '',
        website: artistProfile.website || '',
      });
      setCoverageData({
        coverageRadius: artistProfile.coverageRadius ?? null,
        hourlyRateMin: artistProfile.hourlyRateMin ?? 0,
        hourlyRateMax: artistProfile.hourlyRateMax ?? 0,
        requiresDeposit: artistProfile.requiresDeposit ?? false,
        depositPercentage: artistProfile.depositPercentage ?? 30,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error loading profile:', message);
      setError(message || 'Error al cargar el perfil');
      
      if (isArtistNotFoundError(err)) {
        document.cookie = 'onboarding_completed=false; path=/; max-age=86400; SameSite=strict';
        router.push('/artist/onboarding');
      } else if (isUnauthorizedError(err)) {
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
      const { secondaryCategory, ...restForm } = formData;
      const payload: Partial<ArtistProfile> = {
        ...restForm,
        baseLocationLabel: formData.baseLocationLabel.trim() || undefined,
        baseLocationLat: formData.baseLocationLat ?? undefined,
        baseLocationLng: formData.baseLocationLng ?? undefined,
        category: formData.category || undefined,
        specialties: secondaryCategory ? [secondaryCategory] : [],
      };

      await sdk.updateArtistProfile(payload);
      toast.success('Perfil actualizado exitosamente');
      
      // Recargar el perfil
      await loadProfile();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error updating profile:', message);
      toast.error(message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCoverage = async () => {
    try {
      setIsSavingCoverage(true);
      await sdk.updateArtistProfile(coverageData);
      toast.success('Configuración de cobertura actualizada');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar');
    } finally {
      setIsSavingCoverage(false);
    }
  };

  const handleSaveSocial = async () => {
    try {
      setIsSavingSocial(true);
      await sdk.updateArtistProfile(socialData);
      toast.success('Redes sociales actualizadas');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar');
    } finally {
      setIsSavingSocial(false);
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

  const MAX_BIRTH_DATE = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  const uploadVerifyFile = async (
    file: File,
    folder: 'front' | 'back' | 'selfie',
  ) => {
    setVerifyUploading((prev) => ({ ...prev, [folder]: true }));
    try {
      const urlKey = folder === 'front' ? 'documentFrontUrl' : folder === 'back' ? 'documentBackUrl' : 'documentSelfieUrl';
      const existingUrl = verifyData[urlKey];

      // Delete the previous Cloudinary asset before uploading the replacement
      if (existingUrl) {
        await fetch('/api/users/documents/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: existingUrl }),
        });
      }

      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/users/documents/upload?folder=${folder}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setVerifyData((prev) => ({ ...prev, [urlKey]: data.url }));
      setVerifyPreviews((prev) => ({ ...prev, [folder]: URL.createObjectURL(file) }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setVerifyUploading((prev) => ({ ...prev, [folder]: false }));
    }
  };

  const handleSaveVerify = async () => {
    if (!verifyData.ciudad.trim()) { toast.error('Ingresa tu ciudad'); return; }
    if (!verifyData.birthDate) { toast.error('Ingresa tu fecha de nacimiento'); return; }
    if (!verifyData.documentNumber.trim()) { toast.error('Ingresa tu número de documento'); return; }
    if (!verifyData.documentFrontUrl) { toast.error('Sube la foto frontal de tu documento'); return; }
    if (!verifyData.documentSelfieUrl) { toast.error('Sube tu selfie con el documento'); return; }

    setIsSavingVerify(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudad: verifyData.ciudad.trim(),
          birthDate: verifyData.birthDate,
          documentType: verifyData.documentType,
          documentNumber: verifyData.documentNumber.trim(),
          documentFrontUrl: verifyData.documentFrontUrl,
          documentBackUrl: verifyData.documentBackUrl || null,
          documentSelfieUrl: verifyData.documentSelfieUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Error al guardar');
      }
      // Refresh user in context
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        updateUser(meData.user);
      }
      toast.success('Verificación guardada correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSavingVerify(false);
    }
  };

  const needsVerification = !authUser?.ciudad || !authUser?.birthDate || !authUser?.documentFrontUrl;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalAvatar(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/users/avatar', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const avatarUrl: string | undefined = data?.avatar;
      // Persist directly to artists-service — don't rely on fire-and-forget background sync
      if (avatarUrl) {
        await sdk.updateArtistProfile({ avatar: avatarUrl });
      }
      toast.success('Foto actualizada');
      await loadProfile();
    } catch {
      toast.error('Error al subir la foto');
      setLocalAvatar(null);
    } finally { setAvatarUploading(false); }
  };

  const handleDeleteAvatar = async () => {
    setAvatarUploading(true);
    try {
      await fetch('/api/users/avatar', { method: 'DELETE', credentials: 'include' });
      await sdk.updateArtistProfile({ avatar: '' });
      setLocalAvatar(null);
      toast.success('Foto eliminada');
      await loadProfile();
    } catch {
      toast.error('Error al eliminar la foto');
    } finally { setAvatarUploading(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('cover', file);
      const res = await fetch('/api/users/cover', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const coverUrl: string | undefined = data?.coverPhoto;
      if (coverUrl) {
        setLocalCoverPhoto(coverUrl);
        await sdk.updateArtistProfile({ coverPhoto: coverUrl });
      }
      toast.success('Portada actualizada');
      await loadProfile();
    } catch {
      toast.error('Error al subir la portada');
    } finally { setCoverUploading(false); }
  };

  const loadPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const res = await fetch('/api/portafolio/items', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setPortfolioItems(data.portfolio ?? data.items ?? []);
    } catch { /* ignore */ }
    finally { setPortfolioLoading(false); }
  }, []);

  useEffect(() => {
    if (currentTab === 'portfolio') void loadPortfolio();
  }, [currentTab, loadPortfolio]);

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setPortfolioUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        const uploadRes = await fetch('/api/portafolio/upload', { method: 'POST', body: fd, credentials: 'include' });
        if (!uploadRes.ok) throw new Error('Error al subir imagen');
        const { url } = await uploadRes.json();
        const addRes = await fetch('/api/portafolio/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ url, title: file.name.replace(/\.[^/.]+$/, ''), type: 'image' }),
        });
        if (!addRes.ok) throw new Error('Error al guardar en portafolio');
      }
      toast.success('Foto(s) añadida(s) al portafolio');
      await loadPortfolio();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally { setPortfolioUploading(false); }
  };

  const handlePortfolioDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/portafolio/items/${itemId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      setPortfolioItems(prev => prev.filter((i: any) => i.id !== itemId));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const tabs = [
    { id: 'personal',      label: 'Datos Personales',    icon: <ArtistUserIcon className="h-4 w-4" /> },
    { id: 'verificar',     label: 'Verificar identidad', icon: <ArtistShieldIcon className="h-4 w-4" />, badge: needsVerification },
    { id: 'coverage',      label: 'Cobertura',           icon: <ArtistMapPinIcon className="h-4 w-4" /> },
    { id: 'profile',       label: 'Perfil Público',      icon: <ArtistPencilIcon className="h-4 w-4" /> },
    { id: 'portfolio',     label: 'Portafolio',          icon: <ArtistPhotoIcon className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notificaciones',      icon: <ArtistBellIcon className="h-4 w-4" /> },
    { id: 'payments',      label: 'Pagos',               icon: <ArtistCardIcon className="h-4 w-4" /> },
    { id: 'legal',         label: 'Legal',               icon: <ArtistScaleIcon className="h-4 w-4" /> },
  ];

  const hasBaseLocation = formData.baseLocationLat !== null && formData.baseLocationLng !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <PageHelpButton tourId="artistSettingsTour" />
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

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {(artist?.nombre || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{artist?.nombre || 'Configuración'}</h1>
            <p className="text-sm text-gray-400">{artist?.email || ''}</p>
          </div>
        </header>

        <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {(artist?.nombre || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{artist?.nombre || 'Configuración'}</p>
              <p className="text-sm text-gray-400">{artist?.email || ''}</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar nav — visible on desktop always; on mobile only when no tab selected */}
            <nav className={`lg:w-56 shrink-0 ${activeTab ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {tabs.map((tab) => {
                  const active = currentTab === tab.id;
                  const tabBadge = (tab as { badge?: boolean }).badge;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-50 last:border-b-0
                        ${active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <span className={active ? 'text-orange-600' : 'text-gray-400'}>{tab.icon}</span>
                      {tab.label}
                      {tabBadge && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <svg className="ml-auto h-4 w-4 text-gray-300 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {active && !tabBadge && (
                        <span className="hidden lg:inline ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Tab content — visible on desktop always; on mobile only when tab selected */}
            <div className={`flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${activeTab ? 'block' : 'hidden lg:block'}`}>
              {/* Mobile back button */}
              <button
                onClick={() => setActiveTab(null)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-5 -mt-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a configuración
              </button>

              {currentTab === 'verificar' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Verificar identidad</h2>
                    <p className="text-sm text-gray-500 mt-1">Completa tu información de identidad para operar en la plataforma y recibir reservas.</p>
                  </div>

                  {!needsVerification && (
                    <div className="flex items-start gap-3 bg-orange-50 border border-[#FF6B35]/30 rounded-xl p-4">
                      <svg className="h-5 w-5 text-[#FF6B35] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-[#FF6B35]">Identidad verificada</p>
                        <p className="text-sm text-orange-900 mt-0.5">Tu información está completa. Puedes actualizarla en cualquier momento.</p>
                      </div>
                    </div>
                  )}

                  {needsVerification && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Verificación pendiente</p>
                        <p className="text-sm text-amber-700 mt-0.5">Necesitas completar tu verificación para recibir reservas en la plataforma.</p>
                      </div>
                    </div>
                  )}

                  {/* Ciudad + birthDate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={verifyData.ciudad}
                        onChange={(e) => setVerifyData((p) => ({ ...p, ciudad: e.target.value }))}
                        placeholder="Guatemala, Quetzaltenango..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de nacimiento <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={verifyData.birthDate}
                        onChange={(e) => setVerifyData((p) => ({ ...p, birthDate: e.target.value }))}
                        max={MAX_BIRTH_DATE}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-400 mt-1">Debes ser mayor de 18 años.</p>
                    </div>
                  </div>

                  {/* Document type + number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de documento <span className="text-red-500">*</span></label>
                      <select
                        value={verifyData.documentType}
                        onChange={(e) => setVerifyData((p) => ({ ...p, documentType: e.target.value as 'DPI' | 'PASSPORT' | 'RESIDENCE_CARD', documentBackUrl: '' }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-gray-900 bg-white"
                      >
                        <option value="DPI">DPI (Guatemala)</option>
                        <option value="PASSPORT">Pasaporte</option>
                        <option value="RESIDENCE_CARD">Tarjeta de residencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de documento <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={verifyData.documentNumber}
                        onChange={(e) => setVerifyData((p) => ({ ...p, documentNumber: e.target.value }))}
                        placeholder="1234567890101"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-sm text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Document photo uploads */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Fotos del documento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Front */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Frente <span className="text-red-500">*</span></label>
                        <label className="block w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors overflow-hidden relative">
                          {verifyPreviews.front ? (
                            <img src={verifyPreviews.front} alt="Frente" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                              {verifyUploading.front ? <span className="text-xs">Subiendo...</span> : <><svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-xs">Foto frontal</span></> }
                            </div>
                          )}
                          <input type="file" accept="image/*" className="sr-only" disabled={verifyUploading.front} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVerifyFile(f, 'front'); }} />
                        </label>
                      </div>

                      {/* Back — only for DPI */}
                      {verifyData.documentType === 'DPI' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Reverso</label>
                          <label className="block w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors overflow-hidden relative">
                            {verifyPreviews.back ? (
                              <img src={verifyPreviews.back} alt="Reverso" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                                {verifyUploading.back ? <span className="text-xs">Subiendo...</span> : <><svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="text-xs">Foto reverso</span></> }
                              </div>
                            )}
                            <input type="file" accept="image/*" className="sr-only" disabled={verifyUploading.back} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVerifyFile(f, 'back'); }} />
                          </label>
                        </div>
                      )}

                      {/* Selfie */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Selfie con documento <span className="text-red-500">*</span></label>
                        <label className="block w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors overflow-hidden relative">
                          {verifyPreviews.selfie ? (
                            <img src={verifyPreviews.selfie} alt="Selfie" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                              {verifyUploading.selfie ? <span className="text-xs">Subiendo...</span> : <><svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-xs">Selfie con doc.</span></> }
                            </div>
                          )}
                          <input type="file" accept="image/*" className="sr-only" disabled={verifyUploading.selfie} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVerifyFile(f, 'selfie'); }} />
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Las imágenes son procesadas de forma segura y solo se usan para verificar tu identidad.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveVerify}
                      disabled={isSavingVerify || verifyUploading.front || verifyUploading.back || verifyUploading.selfie}
                      className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingVerify ? 'Guardando...' : 'Guardar verificación'}
                    </button>
                  </div>
                </div>
              )}

              {currentTab === 'personal' && (
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de contacto
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+502 1234 5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Años de experiencia
                    </label>
                    <input
                      type="number"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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

                    {hasBaseLocation ? (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        Guardaremos estas coordenadas para calcular automáticamente los costos de traslado.
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Sin coordenadas, no podemos calcular el costo de traslado para tus clientes. Detecta tu ubicación o escribe las coordenadas manualmente.
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

            {currentTab === 'coverage' && (
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
                        {coverageData.coverageRadius === null
                          ? 'Cobertura nacional — trabajas en cualquier ciudad del país. No se cobra viáticos ni traslado al cliente.'
                          : <>Dentro de <span className="font-bold text-orange-600">{coverageData.coverageRadius} km</span> desde tu ciudad base, el traslado es gratuito para el cliente.</>}
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
                          width: coverageData.coverageRadius === null ? '100%' : `${Math.min(100, (coverageData.coverageRadius / 100) * 100)}%`,
                          height: coverageData.coverageRadius === null ? '100%' : `${Math.min(100, (coverageData.coverageRadius / 100) * 100)}%`,
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
                        <span className="text-xs font-medium text-orange-600">
                          {coverageData.coverageRadius === null ? 'Nacional' : `${coverageData.coverageRadius} km`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slider — hidden when Nacional is selected */}
                  {coverageData.coverageRadius !== null && (
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
                  )}
                  {coverageData.coverageRadius === null && (
                    <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                      Sin restricción geográfica — trabajas en cualquier ciudad del país. No se cobran viáticos ni traslado al cliente.
                    </div>
                  )}

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
                      onClick={() => setCoverageData({ ...coverageData, coverageRadius: null })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                        coverageData.coverageRadius === null
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                      }`}
                    >
                      <Globe size={14} />
                      Nacional
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
                          className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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
                          className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
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

            {currentTab === 'profile' && (
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
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"><CheckCircle size={11} /> Verificado</span>
                          )}
                          {artist.isPremium && (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium"><Star size={11} /> Premium</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{artist.category || artist.categoria || 'Categoría'} · {artist.ciudad || 'Ciudad'}</p>
                        {artist.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{artist.bio}</p>}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {artist.rating !== undefined && (
                            <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {artist.rating.toFixed(1)} ({artist.reviewsCount || 0} reseñas)</span>
                          )}
                          {artist.yearsExperience ? <span className="flex items-center gap-1"><Trophy size={12} className="text-orange-400" /> {artist.yearsExperience} años de exp.</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Avatar / Photo section */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Foto de perfil</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                      {(localAvatar || artist?.avatar) ? (
                        <img src={cImg(localAvatar || artist!.avatar!)} alt="Avatar" className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-white text-3xl font-bold">{(artist?.nombre || 'A').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Sube una foto profesional. Recomendamos mínimo 400×400px.</p>
                      <div className="flex gap-3">
                        <label className={`px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium cursor-pointer ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                          {avatarUploading ? 'Subiendo...' : 'Subir foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                        </label>
                        {(localAvatar || artist?.avatar) && (
                          <button onClick={handleDeleteAvatar} disabled={avatarUploading} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-60">
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover photo */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Foto de portada</h3>
                  <label className={`block cursor-pointer ${coverUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {(localCoverPhoto || artist?.coverPhoto) ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                        <img
                          src={cImg(localCoverPhoto || artist!.coverPhoto!)}
                          alt="Foto de portada"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-semibold">Cambiar portada</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-r from-orange-200 to-purple-200 rounded-lg flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
                        {coverUploading ? 'Subiendo...' : 'Haz clic para subir foto de portada (1200×400px recomendado)'}
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
                  </label>
                </div>

                {/* Social links */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Redes sociales</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Aparecerán en tu perfil público para que los clientes puedan seguirte.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {([
                      { key: 'instagram' as const, label: 'Instagram', placeholder: '@tuusuario o https://instagram.com/...' },
                      { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/...' },
                      { key: 'youtube' as const, label: 'YouTube', placeholder: 'https://youtube.com/...' },
                      { key: 'tiktok' as const, label: 'TikTok', placeholder: '@tuusuario o https://tiktok.com/...' },
                      { key: 'website' as const, label: 'Sitio web', placeholder: 'https://tuweb.com' },
                    ] as const).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type="text"
                          value={socialData[key]}
                          onChange={(e) => setSocialData((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveSocial}
                      disabled={isSavingSocial}
                      className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e05e00] transition-colors text-sm font-semibold disabled:opacity-60"
                    >
                      {isSavingSocial ? 'Guardando...' : 'Guardar redes sociales'}
                    </button>
                  </div>
                </div>

                {/* Category & specialties */}
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Categoría y especialidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría principal</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Seleccionar categoría...</option>
                        {ARTIST_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría secundaria</label>
                      <select
                        value={formData.secondaryCategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, secondaryCategory: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Sin categoría secundaria</option>
                        {ARTIST_CATEGORIES.filter((cat) => cat.value !== formData.category).map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong className="flex items-center gap-1.5"><Lightbulb size={14} className="text-blue-600" /> Consejo:</strong> Los artistas con foto de perfil y portada reciben hasta 3x más visitas en su perfil. ¡Complétalo!
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e05e00] transition-colors text-sm font-semibold disabled:opacity-60"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {currentTab === 'portfolio' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Portafolio</h2>
                  <p className="text-sm text-gray-500">Sube fotos de tu trabajo para que los clientes puedan ver tu estilo.</p>
                </div>

                {/* Upload button */}
                <label className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${portfolioUploading ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' : 'border-[#FF6B35]/40 hover:border-[#FF6B35] hover:bg-orange-50'}`}>
                  {portfolioUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-[#FF6B35]" />
                  ) : (
                    <svg className="h-5 w-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span className="text-sm font-semibold text-[#FF6B35]">
                    {portfolioUploading ? 'Subiendo...' : 'Añadir fotos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioUpload}
                    disabled={portfolioUploading}
                  />
                </label>

                {/* Grid */}
                {portfolioLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : portfolioItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                      <ArtistPhotoIcon className="h-8 w-8 text-[#FF6B35]" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">Sin fotos aún</p>
                    <p className="text-sm text-gray-400">Sube fotos de tu trabajo para destacar tu talento</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolioItems.map((item: any) => (
                      <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={item.url ?? item.imageUrl}
                          alt={item.title ?? 'Portfolio'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handlePortfolioDelete(item.id)}
                            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                            aria-label="Eliminar foto"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                            <p className="text-white text-xs font-medium truncate">{item.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {portfolioItems.length} foto{portfolioItems.length !== 1 ? 's' : ''} en tu portafolio
                </p>
              </div>
            )}

            {currentTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Notificaciones</h2>
                  <p className="text-sm text-gray-500">Elige cuándo y cómo quieres recibir avisos.</p>
                </div>

                {([
                  {
                    section: 'Reservas',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    items: [
                      { id: 'booking_new', label: 'Nueva solicitud de reserva', desc: 'Cuando un cliente solicita tu servicio', defaultOn: true },
                      { id: 'booking_confirmed', label: 'Reserva confirmada', desc: 'Cuando una reserva es aceptada', defaultOn: true },
                      { id: 'booking_cancelled', label: 'Reserva cancelada', desc: 'Cuando un cliente cancela', defaultOn: true },
                      { id: 'booking_reminder', label: 'Recordatorio de evento', desc: '24 horas antes de tu próxima reserva', defaultOn: true },
                    ],
                  },
                  {
                    section: 'Pagos',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    items: [
                      { id: 'payment_received', label: 'Pago recibido', desc: 'Cuando recibes un pago o anticipo', defaultOn: true },
                      { id: 'payment_pending', label: 'Pago pendiente', desc: 'Recordatorio de pagos no recibidos', defaultOn: false },
                    ],
                  },
                  {
                    section: 'Reseñas y mensajes',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ),
                    items: [
                      { id: 'review_new', label: 'Nueva reseña', desc: 'Cuando un cliente deja una valoración', defaultOn: true },
                      { id: 'message_new', label: 'Mensaje nuevo', desc: 'Cuando recibes un mensaje de un cliente', defaultOn: true },
                    ],
                  },
                  {
                    section: 'Marketing',
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    ),
                    items: [
                      { id: 'promo_tips', label: 'Consejos para mejorar tu perfil', desc: 'Sugerencias para atraer más clientes', defaultOn: false },
                      { id: 'promo_news', label: 'Novedades de Piums', desc: 'Nuevas funciones y actualizaciones', defaultOn: false },
                    ],
                  },
                ] as { section: string; icon: React.ReactNode; items: { id: string; label: string; desc: string; defaultOn: boolean }[] }[]).map((group) => (
                  <div key={group.section} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 border-b border-gray-200">
                      <span className="text-[#FF6B35]">{group.icon}</span>
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

            {currentTab === 'payments' && (
              <div className="text-center py-12">
                <CreditCard size={56} className="mx-auto mb-4 text-gray-300" />
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

            {currentTab === 'legal' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Legal</h2>
                  <p className="text-sm text-gray-500">Términos, privacidad y políticas de uso de la plataforma.</p>
                </div>

                {([
                  {
                    id: 'terms',
                    title: 'Términos y Condiciones de Uso',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    content: (
                      <>
                        <p>Al usar Piums aceptas estos Términos y Condiciones. Piums es una plataforma que conecta a artistas y creativos con personas que requieren sus servicios.</p>
                        <p className="font-medium text-gray-800 mt-2">1. Uso de la plataforma</p>
                        <p>Debes ser mayor de 18 años para crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas con tu cuenta.</p>
                        <p className="font-medium text-gray-800 mt-2">2. Reservas y comisiones</p>
                        <p>Piums actúa como intermediario. Los precios son establecidos por cada artista. Piums puede retener una comisión por facilitar la transacción.</p>
                        <p className="font-medium text-gray-800 mt-2">3. Cancelaciones</p>
                        <p>Cada artista puede definir su política de cancelación. Los reembolsos se gestionan según la política configurada en cada servicio.</p>
                        <p className="font-medium text-gray-800 mt-2">4. Modificaciones</p>
                        <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento con notificación previa por correo electrónico.</p>
                      </>
                    ),
                  },
                  {
                    id: 'privacy',
                    title: 'Política de Privacidad',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ),
                    content: (
                      <>
                        <p>Tu privacidad es importante para nosotros. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.</p>
                        <p className="font-medium text-gray-800 mt-2">Datos que recopilamos</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Nombre, correo, foto de perfil y datos del negocio</li>
                          <li>Historial de reservas, reseñas y servicios ofrecidos</li>
                          <li>Información de pago y de cuenta Stripe Connect</li>
                          <li>Ubicación base para cálculo de cobertura y traslados</li>
                        </ul>
                        <p className="font-medium text-gray-800 mt-2">Tus derechos</p>
                        <p>Puedes solicitar acceso, rectificación o eliminación de tus datos escribiéndonos a <span className="font-medium text-orange-600">privacidad@piums.com</span>.</p>
                      </>
                    ),
                  },
                  {
                    id: 'cookies',
                    title: 'Política de Cookies',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    content: (
                      <>
                        <p>Usamos cookies esenciales para la autenticación y funcionamiento, analíticas para mejorar la plataforma, y de preferencias para recordar tu configuración.</p>
                        <p className="mt-2">Puedes desactivar las cookies no esenciales desde la configuración de tu navegador.</p>
                      </>
                    ),
                  },
                  {
                    id: 'contact',
                    title: 'Contacto y Soporte',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ),
                    content: (
                      <div className="space-y-2">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-orange-600">soporte@piums.com</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            <span className="font-medium text-orange-600">privacidad@piums.com</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-600">Lunes a viernes, 9:00 – 18:00 (GMT-6)</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Última actualización: marzo 2026 · Versión 1.0</p>
                      </div>
                    ),
                  },
                ] as { id: string; title: string; icon: React.ReactNode; content: React.ReactNode }[]).map((section) => (
                  <LegalAccordion key={section.id} section={section} />
                ))}

                <p className="text-xs text-gray-400 text-center pt-2">
                  Al usar Piums confirmas que has leído y aceptas nuestros términos y políticas.
                </p>
              </div>
            )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function ArtistUserIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function ArtistShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function ArtistMapPinIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ArtistPencilIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function ArtistBellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function ArtistCardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function ArtistScaleIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
}
function ArtistPhotoIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
