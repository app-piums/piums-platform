'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { SavedCoupon, CouponValidation } from '@piums/sdk';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDiscount(coupon: SavedCoupon) {
  if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}% de descuento`;
  return `$${coupon.discountValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} de descuento`;
}

function formatExpiry(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
  return { formatted, daysLeft, isExpiringSoon: daysLeft <= 7 && daysLeft > 0 };
}

// ─── Coupon Card ──────────────────────────────────────────────────────────────

function CouponCard({ coupon }: { coupon: SavedCoupon }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(coupon.code)}`;
  const expiry = formatExpiry(coupon.expiresAt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback not critical
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Top bar */}
      <div className="h-2 bg-gradient-to-r from-[#FF6A00] to-orange-400" />

      <div className="p-5 flex gap-4">
        {/* QR */}
        <div className="shrink-0">
          <img
            src={qrUrl}
            alt={`QR ${coupon.code}`}
            width={96}
            height={96}
            className="rounded-xl border border-gray-100"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{coupon.name}</h3>
              {coupon.description && (
                <p className="text-sm text-gray-500 mt-0.5">{coupon.description}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-[#FF6A00] bg-orange-50 rounded-lg px-2.5 py-1 whitespace-nowrap">
              {formatDiscount(coupon)}
            </span>
          </div>

          {/* Code + copy */}
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono font-bold tracking-widest text-lg text-gray-900 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              {coupon.code}
            </span>
            <button
              onClick={handleCopy}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Expiry */}
          {expiry && (
            <p className={`mt-2 text-xs font-medium ${expiry.isExpiringSoon ? 'text-orange-600' : 'text-gray-400'}`}>
              {expiry.isExpiringSoon
                ? `⚠ Vence en ${expiry.daysLeft} día${expiry.daysLeft === 1 ? '' : 's'}`
                : `Válido hasta: ${expiry.formatted}`}
            </p>
          )}
          {coupon.minimumAmount != null && (
            <p className="mt-1 text-xs text-gray-400">
              Mínimo de compra: ${coupon.minimumAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Validate Coupon Section ──────────────────────────────────────────────────

function ValidateCouponSection() {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CouponValidation | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setValidating(true);
    setResult(null);
    try {
      const res = await sdk.validateCoupon(code.trim().toUpperCase(), 0);
      setResult(res);
    } catch {
      setResult({ valid: false, discount: 0, error: 'No se pudo validar el cupón' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-1">¿Tienes un código?</h2>
      <p className="text-sm text-gray-500 mb-4">Ingresa tu código para verificar si es válido.</p>

      <form onSubmit={handleValidate} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
          placeholder="Ej: PIUMS20"
          className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-mono font-semibold tracking-wider text-gray-900 placeholder:font-normal placeholder:tracking-normal outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition"
        />
        <button
          type="submit"
          disabled={validating || !code.trim()}
          className="rounded-xl bg-[#FF6A00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors"
        >
          {validating ? 'Validando...' : 'Verificar'}
        </button>
      </form>

      {result && (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
          result.valid
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {result.valid ? (
            <>
              ¡Cupón válido! Descuento:{' '}
              <strong>
                {result.coupon?.discountType === 'PERCENTAGE'
                  ? `${result.coupon.discountValue}%`
                  : `$${result.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </strong>
              {result.coupon?.name && <span className="ml-1 text-green-600">— {result.coupon.name}</span>}
            </>
          ) : (
            result.error || 'Cupón no válido'
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<SavedCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    sdk.getMyCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) return <Loading fullScreen />;

  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <ClientSidebar userName={userName} />
      <div className="flex-1 min-w-0 pt-20 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Cupones</h1>
            <p className="mt-1 text-sm text-gray-500">Cupones y descuentos disponibles para tus reservas</p>
          </div>

          {/* Coupon list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
              <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-gray-500 font-medium">No tienes cupones disponibles</p>
              <p className="text-sm text-gray-400 mt-1">Los cupones asignados aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid gap-4 mb-6">
              {coupons.map((c) => (
                <CouponCard key={c.id} coupon={c} />
              ))}
            </div>
          )}

          {/* Validate section */}
          <ValidateCouponSection />
        </div>
      </div>
    </div>
  );
}
