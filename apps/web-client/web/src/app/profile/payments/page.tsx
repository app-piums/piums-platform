'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// ── helpers ──────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = STRIPE_KEY && !STRIPE_KEY.includes('your_stripe')
  ? loadStripe(STRIPE_KEY)
  : null;

const BRAND_COLORS: Record<string, string> = {
  visa:             'from-blue-600 to-blue-800',
  mastercard:       'from-red-600 to-orange-600',
  amex:             'from-green-600 to-teal-700',
  discover:         'from-orange-500 to-yellow-600',
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

// ── types ─────────────────────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  isDefault: boolean;
}

// ── Stripe card form ──────────────────────────────────────────────────────────

const CARD_ELEMENT_OPTS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a202c',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      '::placeholder': { color: '#a0aec0' },
    },
    invalid: { color: '#e53e3e' },
  },
};

function StripeCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');
  const [setDef, setSetDef]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    setSaving(true);
    setError('');
    try {
      const { error: stripeErr, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardEl,
      });

      if (stripeErr) {
        setError(stripeErr.message ?? 'Error al procesar la tarjeta');
        return;
      }

      const res = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stripePaymentMethodId: paymentMethod!.id, setAsDefault: setDef }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Error al guardar la tarjeta');
        return;
      }
      onSuccess();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Datos de la tarjeta</label>
        <div className="border border-gray-300 rounded-xl px-4 py-3.5 focus-within:border-[#FF6A00] focus-within:ring-1 focus-within:ring-[#FF6A00] transition-colors bg-white">
          <CardElement options={CARD_ELEMENT_OPTS} />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={setDef}
          onChange={e => setSetDef(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-[#FF6A00]"
        />
        <span className="text-sm text-gray-700">Usar como tarjeta predeterminada</span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || !stripe}
          className="flex-1 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando…' : 'Guardar tarjeta'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Demo form (when Stripe key is not configured) ─────────────────────────────

function DemoCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState('');
  const [setDef, setSetDef]     = useState(false);
  const [cardNum,  setCardNum]  = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvv,      setCvv]      = useState('');
  const [name,     setName]     = useState('');

  function formatCardNum(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  }

  function detectBrand(num: string): string {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n))           return 'VISA';
    if (/^5[1-5]/.test(n))      return 'MASTERCARD';
    if (/^3[47]/.test(n))       return 'AMEX';
    if (/^6(?:011|5)/.test(n))  return 'DISCOVER';
    return 'CARD';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNum.replace(/\s/g, '');
    if (digits.length < 13) { setError('Número de tarjeta inválido'); return; }
    const [mm, yy] = expiry.split('/');
    if (!mm || !yy || mm.length < 2 || yy.length < 2) { setError('Fecha de vencimiento inválida'); return; }
    if (!cvv || cvv.length < 3) { setError('CVV inválido'); return; }

    setSaving(true);
    setError('');
    try {
      const brand  = detectBrand(digits);
      const last4  = digits.slice(-4);
      const expM   = parseInt(mm, 10);
      const expY   = parseInt(yy, 10) + (parseInt(yy, 10) < 100 ? 2000 : 0);
      const token  = `demo_${brand.toLowerCase()}_${last4}_${Date.now()}`;

      const res = await fetch('/api/payments/methods/save-token', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider: 'STRIPE',
          token,
          cardBrand: brand,
          cardLast4: last4,
          cardExpMonth: expM,
          cardExpYear: expY,
          setAsDefault: setDef,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Error al guardar la tarjeta');
        return;
      }
      onSuccess();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        Modo desarrollo — configura <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> para producción.
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Titular</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre en la tarjeta"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
        <input
          type="text"
          inputMode="numeric"
          value={cardNum}
          onChange={e => setCardNum(formatCardNum(e.target.value))}
          placeholder="1234 5678 9012 3456"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
          <input
            type="password"
            inputMode="numeric"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0,4))}
            placeholder="•••"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={setDef}
          onChange={e => setSetDef(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-[#FF6A00]"
        />
        <span className="text-sm text-gray-700">Usar como tarjeta predeterminada</span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55f00] transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar tarjeta'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentsTab() {
  const [methods,     setMethods]     = useState<PaymentMethod[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [actionId,    setActionId]    = useState<string | null>(null);

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

  function handleAddSuccess() {
    setShowAdd(false);
    load();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-sm text-gray-600 mt-1">Administra tus tarjetas guardadas</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
        >
          + Agregar tarjeta
        </button>
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
          <p className="text-sm text-gray-500 mb-4">Agrega una tarjeta para pagar reservas más rápido</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
          >
            Agregar tarjeta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const brand   = m.cardBrand ?? '';
            const label   = brandLabel(brand);
            const last4   = m.cardLast4 ?? '••••';
            const expM    = m.cardExpMonth?.toString().padStart(2, '0') ?? '--';
            const expY    = m.cardExpYear ?? '--';
            const busy    = actionId === m.id;

            return (
              <div
                key={m.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${m.isDefault ? 'border-[#FF6A00]/40 bg-[#FF6A00]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                {/* Card visual */}
                <div className={`w-14 h-9 rounded-lg bg-gradient-to-br ${brandColor(brand)} flex items-end p-1.5 shrink-0`}>
                  <span className="text-white text-[9px] font-bold tracking-wider">••••{last4}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{label} •••• {last4}</span>
                    {m.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF6A00]/10 text-[#FF6A00]">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Vence {expM}/{expY}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {!m.isDefault && (
                    <button
                      onClick={() => handleSetDefault(m.id)}
                      disabled={busy}
                      className="text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors disabled:opacity-40"
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

      {/* Security note */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Seguridad de tus pagos</h3>
        <ul className="space-y-2">
          {[
            'Tus datos de pago están encriptados y seguros con Stripe',
            'Nunca almacenamos tu número de tarjeta completo',
            'Todas las transacciones están protegidas por SSL',
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

      {/* Add Card Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Agregar tarjeta</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <StripeCardForm onSuccess={handleAddSuccess} onCancel={() => setShowAdd(false)} />
              </Elements>
            ) : (
              <DemoCardForm onSuccess={handleAddSuccess} onCancel={() => setShowAdd(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
