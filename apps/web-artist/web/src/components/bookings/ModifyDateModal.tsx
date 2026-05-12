'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/errors';

interface ModifyDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  currentDate: string;
  onConfirm: (newDate: string) => Promise<void>;
}

export const ModifyDateModal: React.FC<ModifyDateModalProps> = ({
  isOpen,
  onClose,
  bookingCode,
  currentDate,
  onConfirm,
}) => {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newDate) {
      setError('Por favor, selecciona una nueva fecha');
      return;
    }

    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('La fecha debe ser futura');
      return;
    }

    setLoading(true);

    try {
      await onConfirm(newDate);
      setNewDate('');
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Error al modificar la fecha. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Modificar Fecha de Reserva
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Selecciona una nueva fecha para tu reserva.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Código: <span className="font-mono font-semibold">{bookingCode}</span>
                  </p>

                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
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
                        <p className="text-sm text-blue-700">
                          El artista será notificado sobre el cambio de fecha y deberá confirmar la nueva disponibilidad.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-4">
                    <div>
                      <label htmlFor="currentDate" className="block text-sm font-medium text-gray-700">
                        Fecha actual
                      </label>
                      <input
                        type="text"
                        id="currentDate"
                        value={new Date(currentDate).toLocaleDateString('es-GT', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm text-gray-500"
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">
                        Nueva fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="newDate"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        disabled={loading}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </form>

                  {error && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !newDate}
            >
              {loading ? 'Modificando...' : 'Confirmar Cambio'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
