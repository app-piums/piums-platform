'use client';

import React, { useState, useEffect, useCallback } from 'react';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const BRAND_COLORS: Record<string, string> = {
  visa:              'from-blue-600 to-blue-800',
  mastercard:        'from-red-600 to-orange-600',
  amex:              'from-green-600 to-teal-700',
  discover:          'from-orange-500 to-yellow-600',
  'american express':'from-green-600 to-teal-700',
};

function brandColor(brand: string) {
  return BRAND_COLORS[brand?.toLowerCase()] ?? 'from-gray-500 to-gray-700';
}

function brandLabel(brand: string) {
  const map: Record<string, string> = {
    visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex',
    discover: 'Discover', 'american express': 'Amex',
  };
  return map[brand?.toLowerCase()] ?? brand ?? 'Tarjeta';
}

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  isDefault: boolean;
}

export default function PaymentsTab() {
  const [methods,  setMethods]  = useState<PaymentMethod[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/methods', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMethods(data.methods ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSetDefault(id: string) {
    setActionId(id);
    try {
      await fetch(`/api/payments/methods/${id}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      await load();
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (methods.length <= 1) {
      alert('Debes tener al menos una tarjeta guardada.');
      return;
    }
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    setActionId(id);
    try {
      await fetch(`/api/payments/methods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await load();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
        <p className="text-sm text-gray-600 mt-1">Tus tarjetas guardadas para pagar reservas</p>
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="w-14 h-14 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin tarjetas guardadas</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Tu tarjeta se guardará automáticamente al completar tu primer pago con Tilopay.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const brand = m.cardBrand ?? '';
            const label = brandLabel(brand);
            const last4 = m.cardLast4 ?? '••••';
            const expM  = m.cardExpMonth?.toString().padStart(2, '0') ?? '--';
            const expY  = m.cardExpYear ?? '--';
            const busy  = actionId === m.id;

            return (
              <div
                key={m.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${m.isDefault ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className={`w-14 h-9 rounded-lg bg-gradient-to-br ${brandColor(brand)} flex items-end p-1.5 shrink-0`}>
                  <span className="text-white text-[9px] font-bold tracking-wider">••••{last4}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{label} •••• {last4}</span>
                    {m.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF6B35]/10 text-[#FF6B35]">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Vence {expM}/{expY}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!m.isDefault && (
                    <button
                      onClick={() => handleSetDefault(m.id)}
                      disabled={busy}
                      className="text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-40"
                    >
                      {busy ? '…' : 'Predeterminar'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={busy || methods.length <= 1}
                    title={methods.length <= 1 ? 'Debes tener al menos una tarjeta' : undefined}
                    className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy ? '…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Seguridad de tus pagos</h3>
        <ul className="space-y-2">
          {[
            'Tus datos de tarjeta son procesados de forma segura por Tilopay',
            'Nunca almacenamos tu número de tarjeta completo',
            'Tu tarjeta queda guardada automáticamente tras tu primer pago exitoso',
            'Puedes eliminar tus tarjetas en cualquier momento',
          ].map(text => (
            <li key={text} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
