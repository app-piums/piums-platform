'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';

type PersonalInfoTabProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

type ProfileFormData = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

export default function PersonalInfoTab(props: PersonalInfoTabProps = {}) {
  const { onDirtyChange } = props;
  const { user } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
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
      alert('Avatar eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar avatar:', err);
      alert('Error al eliminar avatar');
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
      alert('Avatar actualizado correctamente');
    } catch (err) {
      console.error('Error al subir avatar:', err);
      alert('Error al subir avatar');
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
      // TODO: Call API to update profile
      // const userId = user?.id;
      // await sdk.updateProfile(userId, formData);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setInitialData({ ...formData });
      setEditing(false);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
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
    </div>
  );
}
