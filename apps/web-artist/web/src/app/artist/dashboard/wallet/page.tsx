"use client";

import { useState, useEffect } from "react";
import { PageHelpButton } from '@/components/PageHelpButton';
import { DashboardSidebar } from "@/components/artist/DashboardSidebar";
import { sdk } from '@piums/sdk';
import type { Payout } from '@piums/sdk';

function centsToDisplay(cents: number, currency = 'USD') {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  FAILED:     'bg-red-100 text-red-600',
  CANCELLED:  'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pendiente',
  PROCESSING: 'En proceso',
  COMPLETED:  'Completado',
  FAILED:     'Fallido',
  CANCELLED:  'Cancelado',
};

const TYPE_LABELS: Record<string, string> = {
  BOOKING_PAYMENT: 'Pago por reserva',
  ANTICIPO:        'Anticipo de reserva',
  REFUND:          'Reembolso',
  MANUAL:          'Pago manual',
  BONUS:           'Bono',
};

export default function WalletPage() {
  const [stats, setStats] = useState<{
    totalEarnings: number;
    pendingAmount: number;
    completedAmount: number;
    currency: string;
    totalPayouts: number;
    pendingCount: number;
    completedCount: number;
  } | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatsLoading(true);
    sdk.getMyPayoutStats()
      .then(s => setStats(s))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    sdk.getMyPayouts({ status: statusFilter || undefined, page, limit: 15 })
      .then(res => {
        setPayouts(res.payouts);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(err => setError(err?.message || 'Error al cargar los movimientos'))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  const currency = stats?.currency || 'USD';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <PageHelpButton tourId="artistWalletTour" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8 max-w-4xl">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Billetera</h1>
            <p className="text-sm text-gray-500 mt-1">Historial de pagos recibidos de Piums</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow">
              <p className="text-sm font-medium text-orange-100">Total ganado</p>
              {statsLoading ? (
                <div className="h-9 w-24 bg-orange-400/50 rounded-lg mt-1 animate-pulse" />
              ) : (
                <p className="text-3xl font-bold mt-1">
                  {currency} {centsToDisplay(stats?.totalEarnings ?? 0)}
                </p>
              )}
              <p className="text-xs text-orange-200 mt-1">{stats?.completedCount ?? 0} pagos completados</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Por cobrar</p>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-100 rounded-lg mt-1 animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {currency} {centsToDisplay(stats?.pendingAmount ?? 0)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{stats?.pendingCount ?? 0} pendientes</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Ya recibido</p>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-100 rounded-lg mt-1 animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {currency} {centsToDisplay(stats?.completedAmount ?? 0)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Histórico</p>
            </div>
          </div>

          {/* Info banner — payouts are manual */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <svg className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              Los pagos se procesan manualmente por el equipo de Piums en 1–3 días hábiles tras completarse la reserva.
              Si tienes dudas sobre un pago, contacta a <strong>pagos@piums.io</strong>.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['', 'PENDING', 'COMPLETED', 'PROCESSING', 'FAILED'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s === '' ? 'Todos' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Payouts list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Movimientos</h2>
              {total > 0 && <span className="text-xs text-gray-400">{total} registro{total !== 1 ? 's' : ''}</span>}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-6 w-6 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="px-6 py-8 text-center text-sm text-red-500">{error}</div>
            ) : payouts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-500">Sin movimientos{statusFilter ? ` ${STATUS_LABELS[statusFilter]?.toLowerCase()}s` : ''}</p>
                <p className="text-xs text-gray-400 mt-1">Los pagos aparecerán aquí cuando se completen tus reservas.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.description || TYPE_LABELS[(p as any).payoutType ?? ''] || 'Pago de reserva'}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                        {(p as any).transferReference && (
                          <p className="text-xs text-gray-300 font-mono">Ref: {(p as any).transferReference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-[#FF6A00]">
                        {p.currency} {centsToDisplay((p as any).netAmount ?? p.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{total} registros</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1.5 text-gray-400">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
