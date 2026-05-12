'use client';

import React, { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sdk } from '@piums/sdk';
import type { SavedCoupon } from '@piums/sdk';
import { AlertTriangle } from 'lucide-react';

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

function ArtistCouponCard({ coupon }: { coupon: SavedCoupon }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(coupon.code)}`;
  const expiry = formatExpiry(coupon.expiresAt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // non-critical
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400" />
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
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{coupon.name}</h3>
              {coupon.description && (
                <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
              )}
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 rounded-lg px-2 py-1 whitespace-nowrap">
              {formatDiscount(coupon)}
            </span>
          </div>

          {/* Code row */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold tracking-widest text-base text-gray-900 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
              {coupon.code}
            </span>
            <button
              onClick={handleCopy}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Expiry + metadata */}
          {expiry && (
            <p className={`mt-2 text-xs font-medium ${expiry.isExpiringSoon ? 'text-orange-600' : 'text-gray-400'}`}>
              {expiry.isExpiringSoon
                ? <span className="flex items-center gap-1"><AlertTriangle size={11} /> Vence en {expiry.daysLeft} día{expiry.daysLeft === 1 ? '' : 's'}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtistCouponsPage() {
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
    sdk.getArtistCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 pt-20 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Cupones</h1>
            <p className="mt-1 text-sm text-gray-500">Cupones asignados a tu perfil de artista</p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <svg
                className="h-14 w-14 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-gray-600 font-semibold">No tienes cupones asignados actualmente</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Cuando el equipo de Piums te asigne cupones de descuento, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {coupons.map((c) => (
                <ArtistCouponCard key={c.id} coupon={c} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
