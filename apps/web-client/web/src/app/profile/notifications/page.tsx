'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/Button';

export default function NotificationsTab() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    email: {
      bookings: true,
      messages: true,
      reviews: false,
      promotions: true,
    },
    sms: {
      bookings: true,
      messages: false,
      reviews: false,
      promotions: false,
    },
    push: {
      bookings: true,
      messages: true,
      reviews: true,
      promotions: false,
    },
  });
  const { t } = useTranslation('notifications');

  const handleToggle = (channel: 'email' | 'sms' | 'push', category: string) => {
    setSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [category]: !prev[channel][category as keyof typeof prev.email],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
              alert(t('success'));
      // await sdk.updateNotificationSettings(settings);
      
      setTimeout(() => {
        setLoading(false);
            alert(t('error'));
      }, 1000);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setLoading(false);
      alert('Error al actualizar la configuración');
    }
            label: t('categories.bookings.label'),
            description: t('categories.bookings.description'),
  const notificationCategories = [
    {
      id: 'bookings',
            label: t('categories.messages.label'),
            description: t('categories.messages.description'),
    },
    {
      id: 'messages',
            label: t('categories.reviews.label'),
            description: t('categories.reviews.description'),
    },
    {
      id: 'reviews',
            label: t('categories.promotions.label'),
            description: t('categories.promotions.description'),
    },
    {
      id: 'promotions',
      label: 'Promociones',
      description: 'Ofertas especiales y novedades de la plataforma',
    },
  ];

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
              <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('subtitle')}</p>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra cómo y cuándo quieres recibir notificaciones
        </p>
      </div>

      {/* Notification Channels Table */}
                      {t('type')}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
                      {t('email')}
              <th scope="col" className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de notificación
                      {t('sms')}
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
                      {t('push')}
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                SMS
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Push
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notificationCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="py-4 pr-6">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <ToggleSwitch
                    checked={settings.email[category.id as keyof typeof settings.email]}
                    onChange={() => handleToggle('email', category.id)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <ToggleSwitch
                    checked={settings.sms[category.id as keyof typeof settings.sms]}
                    onChange={() => handleToggle('sms', category.id)}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <ToggleSwitch
                    checked={settings.push[category.id as keyof typeof settings.push]}
                    onChange={() => handleToggle('push', category.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  <p className="text-sm text-blue-700">{t('info')}</p>
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Las notificaciones importantes relacionadas con tu cuenta y seguridad siempre se enviarán por email.
            </p>
          </div>
                {loading ? t('saving') : t('save')}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </Button>
      </div>
    </div>
  );
}
