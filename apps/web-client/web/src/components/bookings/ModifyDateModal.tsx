'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ModifyDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  currentDate: string;
  onRequested: () => void;
}

export const ModifyDateModal: React.FC<ModifyDateModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  currentDate,
  onRequested,
}) => {
  const [proposedDate, setProposedDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!proposedDate) {
      setError('Por favor, selecciona una nueva fecha');
      return;
    }

    const selected = new Date(proposedDate);
    if (selected <= new Date()) {
      setError('La fecha debe ser futura');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedDate: selected.toISOString(), reason: reason.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error al enviar la solicitud');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProposedDate('');
        setReason('');
        onRequested();
        onClose();
      }, 2000);
    } catch {
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <svg className="h-6 w-6 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Solicitar Cambio de Fecha</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Código: <span className="font-mono font-semibold text-gray-700">{bookingCode}</span>
                </p>
              </div>
            </div>

            {success ? (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">¡Solicitud enviada!</p>
                <p className="text-green-600 text-sm mt-1">El artista revisará tu solicitud y recibirás una notificación.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="bg-orange-50 border-l-4 border-[#FF6A00] rounded-r-xl p-4">
                  <p className="text-sm text-orange-800">
                    El artista deberá <strong>aceptar</strong> tu solicitud y tú recibirás un enlace por email para <strong>confirmar</strong> el cambio definitivo.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha actual</label>
                  <input
                    type="text"
                    value={new Date(currentDate).toLocaleDateString('es-GT', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                    disabled
                    className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva fecha propuesta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6A00] focus:ring-[#FF6A00]"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    disabled={loading}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6A00] focus:ring-[#FF6A00] resize-none"
                    placeholder="Ej: Cambio de planes en el evento..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </form>
            )}
          </div>

          {!success && (
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
              <Button onClick={handleSubmit} disabled={loading || !proposedDate}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              <Button onClick={onClose} variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
