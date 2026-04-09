'use client';

import React, { useState } from 'react';
import { sdk } from '@piums/sdk';

const TIPOS = [
  { value: 'NO_SHOW',      label: 'El cliente no se presentó' },
  { value: 'QUALITY',      label: 'Problema con el servicio' },
  { value: 'PRICING',      label: 'Disputa de precio/pago' },
  { value: 'BEHAVIOR',     label: 'Comportamiento inapropiado' },
  { value: 'CANCELLATION', label: 'Cancelación injustificada' },
  { value: 'OTHER',        label: 'Otro' },
] as const;

interface Props {
  bookingId: string;
  reportedAgainst?: string;
  clientName?: string;
  onClose: () => void;
  onSuccess: (disputeId: string) => void;
}

export function ReportarQuejaModal({ bookingId, reportedAgainst, clientName, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<string>('');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !asunto.trim() || !descripcion.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const dispute = await sdk.createDispute({
        bookingId,
        disputeType: tipo,
        subject: asunto.trim(),
        description: descripcion.trim(),
        reportedAgainst,
      });
      onSuccess(dispute.id);
    } catch (err: any) {
      setError(err?.message || 'Error al enviar la queja. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Reportar queja</h2>
              {clientName && <p className="text-xs text-gray-400">Sobre reserva con {clientName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de queja</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    tipo === value
                      ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Asunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              maxLength={120}
              placeholder="Ej: El cliente no asistió al evento contratado"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 transition"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe con detalle lo que ocurrió. Esto ayuda al equipo de Piums a resolver tu caso más rápido."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 transition resize-none"
            />
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Tu queja será revisada por el equipo de Piums. Te notificaremos cuando haya una actualización.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !tipo || !asunto.trim() || !descripcion.trim()}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando…
                </span>
              ) : 'Enviar queja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
