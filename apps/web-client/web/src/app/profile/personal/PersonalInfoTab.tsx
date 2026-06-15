'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import { toast } from '@/lib/toast';
import { sdk } from '@piums/sdk';

type PersonalInfoTabProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

type ProfileFormData = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

export default function PersonalInfoTab(props: PersonalInfoTabProps) {
  const { onDirtyChange } = props;
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    sdk.getCalendarStatus().then(({ enabled }) => setCalendarEnabled(enabled));
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendarConnected') === 'true') {
      setCalendarEnabled(true);
      toast.success('Google Calendar conectado correctamente');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error') === 'calendar_denied') {
      toast.error('Conexion con Google Calendar cancelada');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error') === 'google_not_configured') {
      toast.error('Google Calendar no está disponible aún. Contacta al administrador.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error') === 'calendar_invalid') {
      toast.error('Sesión expirada. Vuelve a intentarlo.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error') === 'calendar_failed') {
      toast.error('Error al conectar Google Calendar. Vuelve a intentarlo.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);
  const [initialAvatar, setInitialAvatar] = useState<string | undefined>(undefined);

  const handleAvatarDelete = async () => {
    if (!user) return;
    setAvatarUploading(true);
    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      if (!res.ok) throw new Error('Error al eliminar avatar');
      setAvatarPreview(undefined);
      setInitialAvatar(undefined);
      setAvatarFile(null);
      toast.success('Avatar eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar avatar:', err);
      toast.error('Error al eliminar avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const baseData = {
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: '',
        direccion: '',
      };
      setFormData(baseData);
      setInitialData(baseData);
      const avatar = user.avatar || undefined;
      setAvatarPreview(avatar);
      setInitialAvatar(avatar);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      // Endpoint backend
      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir avatar');
      const data = await res.json();
      setAvatarPreview(data.avatar);
      setInitialAvatar(data.avatar);
      setAvatarFile(null);
      toast.success('Avatar actualizado correctamente');
    } catch (err) {
      console.error('Error al subir avatar:', err);
      toast.error('Error al subir avatar');
    } finally {
      setAvatarUploading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: formData.nombre,
          ciudad: formData.direccion,
          telefono: formData.telefono,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al actualizar el perfil');
      }
      setInitialData({ ...formData });
      setEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const hasFormChanges = initialData
    ? initialData.nombre !== formData.nombre ||
      initialData.email !== formData.email ||
      initialData.telefono !== formData.telefono ||
      initialData.direccion !== formData.direccion
    : false;

  const hasUnsavedChanges = editing && (hasFormChanges || Boolean(avatarFile));

  const { confirmNavigation } = useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const handleExitClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!confirmNavigation()) {
      event.preventDefault();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra tu información personal y foto de perfil
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)}>
            Editar Perfil
          </Button>
        )}
      </div>

      {/* Avatar Section */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Foto de perfil
        </label>
        <div className="flex items-center gap-6">
          <Avatar
            src={avatarPreview}
            fallback={user?.nombre?.[0].toUpperCase() || 'U'}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex gap-3">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-upload-input"
                onChange={handleAvatarChange}
                disabled={!editing || avatarUploading}
              />
              <label htmlFor="avatar-upload-input">
                <Button size="sm" variant="outline" disabled={!editing || avatarUploading}>
                  {avatarUploading ? 'Subiendo...' : 'Cambiar foto'}
                </Button>
              </label>
              {avatarFile && (
                <Button size="sm" variant="primary" onClick={handleAvatarUpload} disabled={avatarUploading}>
                  Guardar foto
                </Button>
              )}
              <Button size="sm" variant="ghost" disabled={!editing || avatarUploading} onClick={handleAvatarDelete}>
                Eliminar
              </Button>
              <Link
                href="/dashboard"
                onClick={handleExitClick}
                className="ml-auto flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Salir
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG o GIF. Máximo 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Info Form */}
      <form onSubmit={handleSaveProfile}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleInputChange}
                disabled={!editing}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editing}
                required
              />
              {!editing && (
                <p className="text-xs text-gray-500 mt-1">
                  Para cambiar tu correo, contáctanos
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="+52 ###-###-####"
              />
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="Calle, Ciudad, Estado"
              />
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-8 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                if (initialData) {
                  setFormData({ ...initialData });
                } else if (user) {
                  setFormData({
                    nombre: user.nombre || '',
                    email: user.email || '',
                    telefono: '',
                    direccion: '',
                  });
                }
                setAvatarFile(null);
                setAvatarPreview(initialAvatar ?? user?.avatar ?? undefined);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        )}
      </form>

      {/* Google Calendar integration */}
      <div className="mt-6 border border-gray-200 rounded-xl p-5 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path d="M6 2v6l2.5 2.5L6 13v6l6-3 6 3v-6l-2.5-2.5L18 8V2l-6 3-6-3z" fill="#4285F4" fillOpacity=".15" stroke="#4285F4" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">Google Calendar</h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Sincroniza tus reservas automaticamente. Cuando se confirme una reserva, el evento aparecera en tu Google Calendar. Las reprogramaciones y cancelaciones tambien se sincronizan.
          </p>
          {calendarEnabled ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Conectado
              </span>
              <button
                type="button"
                disabled={calendarLoading}
                onClick={async () => {
                  setCalendarLoading(true);
                  try {
                    await sdk.disconnectGoogleCalendar();
                    setCalendarEnabled(false);
                    toast.success('Google Calendar desconectado');
                  } catch {
                    toast.error('Error al desconectar');
                  } finally {
                    setCalendarLoading(false);
                  }
                }}
                className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={calendarLoading}
              onClick={() => {
                window.location.href = '/api/auth/google/calendar-connect';
              }}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#4285F4] hover:bg-[#3367D6] px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M6 2v6l2.5 2.5L6 13v6l6-3 6 3v-6l-2.5-2.5L18 8V2l-6 3-6-3z"/></svg>
              Conectar Google Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
