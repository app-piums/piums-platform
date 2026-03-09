'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sdk } from '@piums/sdk';

export default function SecurityTab() {
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      alert('Por favor, ingresa tu contraseña actual');
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;

    try {
      setLoading(true);
      
      // TODO: Call SDK to change password
      // await sdk.changePassword({ 
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword 
      // });
      
      setTimeout(() => {
        setLoading(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        alert('Contraseña actualizada correctamente');
      }, 1000);
    } catch (error) {
      console.error('Error changing password:', error);
      setLoading(false);
      alert('Error al cambiar la contraseña');
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Muy débil';
    if (password.length < 8) return 'Débil';
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Regular';
    }
    if (!/[!@#$%^&*]/.test(password)) return 'Buena';
    return 'Excelente';
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthColors = {
    'Muy débil': 'text-red-600',
    'Débil': 'text-orange-600',
    'Regular': 'text-yellow-600',
    'Buena': 'text-green-600',
    'Excelente': 'text-green-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra tu contraseña y configuraciones de seguridad
        </p>
      </div>

      {/* Change Password Section */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>
        
        <form onSubmit={handleSubmitPasswordChange} className="max-w-xl">
          <div className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña <span className="text-red-500">*</span>
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
              {passwordData.newPassword && (
                <p className={`text-sm mt-1 ${strengthColors[passwordStrength as keyof typeof strengthColors]}`}>
                  Fortaleza: {passwordStrength}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres. Se recomienda incluir mayúsculas, minúsculas, números y símbolos.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              {passwordData.confirmPassword && (
                <p className={`text-sm mt-1 ${
                  passwordData.newPassword === passwordData.confirmPassword 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {passwordData.newPassword === passwordData.confirmPassword 
                    ? '✓ Las contraseñas coinciden' 
                    : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication (Future Feature) */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Autenticación de dos factores</h3>
        <p className="text-sm text-gray-600 mb-4">
          Añade una capa extra de seguridad a tu cuenta
        </p>
        <Button variant="outline" disabled>
          Próximamente
        </Button>
      </div>

      {/* Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sesiones activas</h3>
        <p className="text-sm text-gray-600 mb-4">
 Administra tus sesiones en distintos dispositivos
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Dispositivo actual</p>
              <p className="text-sm text-gray-600">Tu sesión actual</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Activa</span>
          </div>
        </div>
        <Button variant="outline" disabled>
          Ver todas las sesiones
        </Button>
      </div>
    </div>
  );
}
