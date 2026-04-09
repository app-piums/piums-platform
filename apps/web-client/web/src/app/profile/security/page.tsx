'use client';

import React, { useEffect, useState } from 'react';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import { toast } from '@/lib/toast';

type SecurityTabProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function SecurityTab(props: SecurityTabProps = {}) {
  const { onDirtyChange } = props;
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      toast.warning('Por favor, ingresa tu contraseña actual');
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      toast.warning('La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      // TODO: await sdk.changePassword({ currentPassword, newPassword })
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = Boolean(
    passwordData.currentPassword ||
    passwordData.newPassword ||
    passwordData.confirmPassword
  );

  useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Muy débil';
    if (password.length < 8) return 'Débil';
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) return 'Regular';
    if (!/[!@#$%^&*]/.test(password)) return 'Buena';
    return 'Excelente';
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthColors: Record<string, string> = {
    'Muy débil': 'text-red-600',
    'Débil': 'text-orange-600',
    'Regular': 'text-yellow-600',
    'Buena': 'text-green-600',
    'Excelente': 'text-green-700',
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF6A00] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
        <p className="text-sm text-gray-600 mt-1">Administra tu contraseña y configuraciones de seguridad</p>
      </div>

      {/* Change Password */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>
        <form onSubmit={handleSubmitPasswordChange} className="max-w-xl space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña actual <span className="text-red-500">*</span>
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nueva contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={8}
              className={inputClass}
            />
            {passwordData.newPassword && (
              <p className={`text-sm mt-1 ${strengthColors[passwordStrength] ?? ''}`}>
                Fortaleza: {passwordStrength}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres. Incluye mayúsculas, minúsculas, números y símbolos.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar nueva contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className={inputClass}
            />
            {passwordData.confirmPassword && (
              <p className={`text-sm mt-1 ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {passwordData.newPassword === passwordData.confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>

      {/* Two-Factor Auth */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Autenticación de dos factores</h3>
        <p className="text-sm text-gray-600 mb-4">Añade una capa extra de seguridad a tu cuenta</p>
        <button
          disabled
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
        >
          Próximamente
        </button>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sesiones activas</h3>
        <p className="text-sm text-gray-600 mb-4">Administra tus sesiones en distintos dispositivos</p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Dispositivo actual</p>
              <p className="text-xs text-gray-500 mt-0.5">Tu sesión actual</p>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Activa</span>
          </div>
        </div>
        <button
          disabled
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
        >
          Ver todas las sesiones
        </button>
      </div>
    </div>
  );
}
