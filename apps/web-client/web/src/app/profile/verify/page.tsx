'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

const MAX_BIRTH_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

export default function VerifyClientTab() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [ciudad, setCiudad] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (user) {
      setCiudad(user.ciudad || '');
      setBirthDate(
        user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      );
    }
  }, [user]);

  const isComplete = !!(user?.ciudad && user?.birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciudad.trim()) {
      toast.error('Ingresa tu ciudad');
      return;
    }
    if (!birthDate) {
      toast.error('Ingresa tu fecha de nacimiento');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciudad: ciudad.trim(), birthDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al guardar');
      }

      // Refresh user data in context
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        updateUser(meData.user);
      }

      toast.success('Información guardada correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Verificar cuenta</h2>
        <p className="text-sm text-gray-500 mt-1">
          Completa tu información para acceder a todas las funciones de la plataforma.
        </p>
      </div>

      {isComplete && (
        <div className="flex items-start gap-3 bg-orange-50 border border-[#FF6A00]/30 rounded-xl p-4">
          <svg className="h-5 w-5 text-[#FF6A00] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-[#FF6A00]">Cuenta verificada</p>
            <p className="text-sm text-orange-900 mt-0.5">Tu información está completa. Puedes actualizarla en cualquier momento.</p>
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Información pendiente</p>
            <p className="text-sm text-amber-700 mt-0.5">Completa los datos a continuación para activar tu cuenta completamente.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ciudad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Guatemala, Quetzaltenango..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fecha de nacimiento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={MAX_BIRTH_DATE}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Debes ser mayor de 18 años.</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-semibold hover:bg-[#e05d00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </form>
    </div>
  );
}
