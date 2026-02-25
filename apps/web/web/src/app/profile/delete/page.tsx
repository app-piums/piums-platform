'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function DeleteAccountTab() {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (!password) {
      alert('Por favor, ingresa tu contraseña');
      return;
    }

    if (!understood) {
      alert('Por favor, confirma que entiendes las consecuencias');
      return;
    }

    if (confirmText !== 'ELIMINAR') {
      alert('Por favor, escribe "ELIMINAR" para confirmar');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Call API to delete account
      // await sdk.deleteAccount({ password });
      
      setTimeout(() => {
        setLoading(false);
        alert('Cuenta eliminada correctamente');
        // Redirect to homepage
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setLoading(false);
      alert('Error al eliminar la cuenta');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-red-600">Eliminar Cuenta</h2>
        <p className="text-sm text-gray-600 mt-1">
          Esta acción es permanente y no se puede deshacer
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Advertencia: Esta acción es irreversible
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Al eliminar tu cuenta, perderás permanentemente:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-3">
              <li>Todos tus datos personales y preferencias</li>
              <li>Tu historial de reservas y transacciones</li>
              <li>Tus reseñas y calificaciones</li>
              <li>Cualquier saldo o crédito disponible</li>
              <li>Acceso a mensajes y conversaciones</li>
            </ul>
            <p className="text-sm text-red-700 font-medium">
              No podrás recuperar esta información una vez eliminada la cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Si tienes algún problema, considera estas alternativas antes de eliminar tu cuenta:
            </p>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>
                <strong>•</strong> Contacta a nuestro soporte para resolver dudas
              </li>
              <li>
                <strong>•</strong> Desactiva las notificaciones si recibes muchas
              </li>
              <li>
                <strong>•</strong> Cambia tu contraseña si hay problemas de seguridad
              </li>
            </ul>
            <div className="mt-4">
              <Button size="sm" variant="outline">
                Contactar Soporte
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      {!showConfirmation ? (
        <div>
          <Button
            variant="danger"
            onClick={() => setShowConfirmation(true)}
          >
            Continuar con la eliminación
          </Button>
        </div>
      ) : (
        <div className="border-2 border-red-200 rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Confirmar eliminación de cuenta
          </h3>

          <form onSubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }} className="space-y-6">
            {/* Checkbox */}
            <div className="flex items-start">
              <input
                id="understood"
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="understood" className="ml-3 text-sm text-gray-700">
                Entiendo que esta acción es irreversible y que perderé todos mis datos permanentemente.
              </label>
            </div>

            {/* Confirmation Text */}
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
                Escribe "ELIMINAR" para confirmar <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu contraseña para confirmar <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setPassword('');
                  setUnderstood(false);
                  setConfirmText('');
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={loading || !understood || confirmText !== 'ELIMINAR' || !password}
              >
                {loading ? 'Eliminando cuenta...' : 'Eliminar mi cuenta permanentemente'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
