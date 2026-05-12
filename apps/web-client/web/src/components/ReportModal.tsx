'use client';

import React, { useState } from 'react';
import { Ban, AlertTriangle, EyeOff, XCircle, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onSubmit: (reviewId: string, reason: string, description: string) => Promise<void>;
}

const REPORT_REASONS = [
  { id: 'SPAM',          label: 'Spam o contenido comercial', Icon: Ban },
  { id: 'OFFENSIVE',     label: 'Contenido ofensivo o acoso',  Icon: AlertTriangle },
  { id: 'INAPPROPRIATE', label: 'Contenido inapropiado',       Icon: EyeOff },
  { id: 'FAKE',          label: 'Falso o engañoso',            Icon: XCircle },
  { id: 'OTHER',         label: 'Otro motivo',                 Icon: FileText },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  onSubmit,
}) => {
  const [reason, setReason] = useState('SPAM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim() && reason === 'OTHER') {
      setError('Por favor, describe el motivo del reporte');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(reviewId, reason, description);
      setReason('SPAM');
      setDescription('');
      onClose();
    } catch (err) {
      setError('No se pudo enviar el reporte. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Reportar reseña</h2>
              <p className="text-xs text-gray-400">Ayúdanos a mantener la comunidad segura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del reporte</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    reason === r.id
                      ? 'border-amber-400 bg-amber-50 text-amber-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <r.Icon size={15} className="shrink-0" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción adicional
              {reason !== 'OTHER' && <span className="ml-1 text-gray-400 font-normal">(opcional)</span>}
              {reason === 'OTHER' && <span className="ml-1 text-red-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporciona más detalles sobre el contenido inapropiado…"
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 transition resize-none"
            />
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Los reportes son anónimos. El equipo de Piums revisará este contenido y tomará las medidas necesarias.
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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (reason === 'OTHER' && !description.trim())}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando…
                </span>
              ) : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
