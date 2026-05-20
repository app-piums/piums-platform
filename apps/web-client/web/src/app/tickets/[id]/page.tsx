'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sdk, TicketEvent, TicketTier } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import ClientSidebar from '@/components/ClientSidebar';

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params['id'] as string;

  const [event, setEvent] = useState<TicketEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (sdk as any).getTicketEvent(id)
      .then((e: TicketEvent) => { setEvent(e); if (e.tiers?.length) setSelectedTier(e.tiers[0]); })
      .catch(() => setError('No se pudo cargar el evento'))
      .finally(() => setLoading(false));
  }, [id]);

  const subtotal = selectedTier ? selectedTier.priceCents * quantity : 0;
  const total = Math.max(0, subtotal - couponDiscount);

  async function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await sdk.validateCoupon(couponCode.trim(), subtotal);
      if (res.valid) {
        setCouponDiscount(res.discount);
      } else {
        setCouponDiscount(0);
        setCouponError(res.error || 'Cupon no valido');
      }
    } catch {
      setCouponError('Error al validar el cupon');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handlePurchase() {
    if (!user) {
      router.push(`/login?redirect=/tickets/${id}`);
      return;
    }
    if (!selectedTier) return;
    setPurchasing(true);
    setError('');
    try {
      const returnUrl = `${window.location.origin}/tickets/confirmacion`;
      const result = await (sdk as any).initTicketPurchase(id, {
        tierId: selectedTier.id,
        quantity,
        couponCode: couponCode.trim() || undefined,
        returnUrl: `${returnUrl}/{purchaseId}`,
      });
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.purchase) {
        router.push(`/tickets/confirmacion/${result.purchase.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Cargando evento...</div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">{error || 'Evento no encontrado'}</div>
        </main>
      </div>
    );
  }

  const availableTiers = event.tiers?.filter(t => t.soldQty < t.totalQty) || [];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
    <main className="flex-1 min-w-0 bg-gray-50">
      {event.imageUrl && (
        <div className="w-full h-64 md:h-80 overflow-hidden bg-gray-900">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Event info */}
          <div className="lg:col-span-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>

            <div className="flex items-start gap-2 text-gray-600 mb-2">
              <CalendarIcon />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600 mb-4">
              <MapPinIcon />
              <div>
                <span className="font-medium">{event.venue}</span>
                <span className="text-sm text-gray-500 ml-1">— {event.address}</span>
              </div>
            </div>

            {event.description && (
              <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
              <h2 className="font-semibold text-gray-900 mb-4">Comprar boleto</h2>

              {availableTiers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Entradas agotadas</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {availableTiers.map(tier => (
                      <label key={tier.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTier?.id === tier.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="tier"
                          value={tier.id}
                          checked={selectedTier?.id === tier.id}
                          onChange={() => { setSelectedTier(tier); setQuantity(1); }}
                          className="text-indigo-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-sm">{tier.name}</span>
                          {tier.description && <p className="text-xs text-gray-500 truncate">{tier.description}</p>}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0">
                          {tier.priceCents === 0 ? 'Gratis' : `$${(tier.priceCents / 100).toFixed(2)}`}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-gray-700">Cantidad:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50">-</button>
                      <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[2rem] text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(10, q + 1, (selectedTier ? selectedTier.totalQty - selectedTier.soldQty : 1)))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); setCouponDiscount(0); }}
                        placeholder="Codigo de cupon"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleValidateCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                      >
                        {validatingCoupon ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                    {couponDiscount > 0 && <p className="text-green-600 text-xs mt-1">Descuento aplicado: -${(couponDiscount / 100).toFixed(2)}</p>}
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-100 pt-3 mb-4 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span>
                        <span>-${(couponDiscount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                      <span>Total</span>
                      <span>{total === 0 ? 'Gratis' : `$${(total / 100).toFixed(2)}`}</span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !selectedTier}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {purchasing ? 'Procesando...' : user ? 'Comprar ahora' : 'Iniciar sesion para comprar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  );
}
