'use client';

import React, { useEffect, useState } from 'react';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import { toast } from '@/lib/toast';

type Channel = 'email' | 'sms' | 'push';
type CategoryId = 'bookings' | 'messages' | 'reviews' | 'promotions';

const CATEGORIES: { id: CategoryId; label: string; description: string }[] = [
  { id: 'bookings', label: 'Reservas', description: 'Confirmaciones, recordatorios y cambios en tus reservas' },
  { id: 'messages', label: 'Mensajes', description: 'Nuevos mensajes de artistas y notificaciones de chat' },
  { id: 'reviews', label: 'Reseñas', description: 'Respuestas a tus reseñas y nuevas valoraciones' },
  { id: 'promotions', label: 'Promociones', description: 'Ofertas especiales y novedades de la plataforma' },
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'push', label: 'Push' },
];

type Settings = Record<Channel, Record<CategoryId, boolean>>;

const DEFAULT_SETTINGS: Settings = {
  email: { bookings: true, messages: true, reviews: false, promotions: true },
  sms: { bookings: true, messages: false, reviews: false, promotions: false },
  push: { bookings: true, messages: true, reviews: true, promotions: false },
};

const cloneSettings = (source: Settings): Settings => ({
  email: { ...source.email },
  sms: { ...source.sms },
  push: { ...source.push },
});

const areSettingsEqual = (a: Settings, b: Settings) =>
  CHANNELS.every((channel) =>
    CATEGORIES.every((category) => a[channel.id][category.id] === b[channel.id][category.id])
  );

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:ring-offset-2 ${
        checked ? 'bg-[#FF6A00]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

type NotificationsTabProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function NotificationsTab(props: NotificationsTabProps = {}) {
  const { onDirtyChange } = props;
  const [loading, setLoading] = useState(false);
  const [initialSettings, setInitialSettings] = useState<Settings>(() => cloneSettings(DEFAULT_SETTINGS));
  const [settings, setSettings] = useState<Settings>(() => cloneSettings(DEFAULT_SETTINGS));

  const handleToggle = (channel: Channel, category: CategoryId) => {
    setSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [category]: !prev[channel][category],
      },
    }));
  };

  const hasUnsavedChanges = !areSettingsEqual(settings, initialSettings);

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    setLoading(true);
    try {
      // TODO: await sdk.updateNotificationSettings(settings)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setInitialSettings(cloneSettings(settings));
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra cómo y cuándo quieres recibir notificaciones
        </p>
      </div>

      {/* Channels Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3 pl-4 pr-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de notificación
              </th>
              {CHANNELS.map((ch) => (
                <th key={ch.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {ch.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {CATEGORIES.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 pl-4 pr-6">
                  <p className="text-sm font-medium text-gray-900">{category.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                </td>
                {CHANNELS.map((ch) => (
                  <td key={ch.id} className="px-6 py-4 text-center">
                    <ToggleSwitch
                      checked={settings[ch.id][category.id]}
                      onChange={() => handleToggle(ch.id, category.id)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-orange-50 border-l-4 border-[#FF6A00] p-4 rounded-r-lg">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-[#FF6A00] flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-orange-800">
            Las notificaciones importantes relacionadas con tu cuenta y seguridad siempre se enviarán por email.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges}
          className="px-6 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
}
