'use client';

import React, { useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';

type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'AWAITING_INFO' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
type DisputeType   = 'CANCELLATION' | 'QUALITY' | 'REFUND' | 'NO_SHOW' | 'ARTIST_NO_SHOW' | 'PRICING' | 'BEHAVIOR' | 'OTHER';

interface Dispute {
  id: string;
  bookingId: string;
  disputeType: DisputeType;
  status: DisputeStatus;
  subject: string;
  description: string;
  createdAt: string;
  messages?: any[];
  myRole?: 'reporter' | 'reported';
}

// 'client' in web-client · 'artist' in web-artist — matches the senderType the backend assigns
const MY_SENDER_TYPE = 'client' as const;

const STATUS_CONFIG: Record<DisputeStatus, { label: string; className: string }> = {
  OPEN:          { label: 'Abierta',           className: 'bg-yellow-100 text-yellow-700' },
  IN_REVIEW:     { label: 'En revisión',        className: 'bg-blue-100 text-blue-700' },
  AWAITING_INFO: { label: 'Info solicitada',    className: 'bg-orange-100 text-orange-700' },
  ESCALATED:     { label: 'Escalada',           className: 'bg-red-100 text-red-700' },
  RESOLVED:      { label: 'Resuelta',           className: 'bg-green-100 text-green-700' },
  CLOSED:        { label: 'Cerrada',            className: 'bg-zinc-100 text-zinc-600' },
};

const TYPE_LABELS: Record<DisputeType, string> = {
  CANCELLATION:   'Cancelación',
  QUALITY:        'Calidad',
  REFUND:         'Reembolso',
  NO_SHOW:        'No Show (cliente)',
  ARTIST_NO_SHOW: 'Artista no se presentó',
  PRICING:        'Precio',
  BEHAVIOR:       'Comportamiento',
  OTHER:          'Otro',
};

export default function QuejasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/quejas'); return; }

    (async () => {
      try {
        setLoading(true);
        const data = await sdk.getMyDisputes();
        const asReporter = (data.asReporter ?? []).map((d: any) => ({ ...d, myRole: 'reporter' as const }));
        const asReported = (data.asReported ?? []).map((d: any) => ({ ...d, myRole: 'reported' as const }));
        setDisputes([...asReporter, ...asReported].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (err: any) {
        setError(err?.message || 'Error al cargar las quejas');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <ClientSidebar userName={userName} />
        <PageHelpButton tourId="quejasTour" />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-30">
          <ClientSidebar userName={userName} />
          <span className="text-base font-semibold text-zinc-900">Mis Quejas</span>
          <div className="w-8" />
        </header>

        <div className="flex-1 px-4 lg:px-8 py-6 max-w-4xl mx-auto w-full">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900">Mis Quejas</h1>
            <p className="text-sm text-zinc-500 mt-1">Quejas enviadas sobre tus reservas</p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button onClick={() => location.reload()} className="text-sm text-red-500 underline">
                Reintentar
              </button>
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-zinc-500 font-medium">No tienes quejas registradas</p>
              <p className="text-sm text-zinc-400 text-center max-w-xs">
                Si tienes algún problema con una reserva, puedes reportarlo desde la sección de Reservas.
              </p>
              <Link href="/bookings" className="mt-2 text-sm font-medium text-[#FF6A00] hover:underline">
                Ver mis reservas →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <DisputeCard key={d.id} dispute={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const statusCfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.OPEN;
  const isActive = dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED';
  const previewMsg = (dispute.messages ?? []).filter((m: any) => !m.isStatusUpdate).at(-1);
  const hasUnread = isActive && !!previewMsg && previewMsg.senderType !== MY_SENDER_TYPE;

  return (
    <Link
      href={`/quejas/${dispute.id}`}
      className="block bg-white rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors overflow-hidden"
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                {TYPE_LABELS[dispute.disputeType] ?? dispute.disputeType}
              </span>
              {dispute.myRole === 'reported' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Fuiste reportado
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-900 mb-0.5">{dispute.subject}</p>
            {previewMsg ? (
              <p className={`text-xs flex items-center gap-1.5 truncate ${hasUnread ? 'text-[#FF6A00] font-medium' : 'text-zinc-400'}`}>
                {hasUnread && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6A00] shrink-0" />}
                <span className="font-medium shrink-0">
                  {previewMsg.senderType === MY_SENDER_TYPE ? 'Tú:'
                    : previewMsg.senderType === 'staff' ? 'Piums:'
                    : previewMsg.senderType === 'client' ? 'Cliente:'
                    : 'Artista:'}
                </span>
                <span className="truncate">{previewMsg.message}</span>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                {new Date(dispute.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-[#FF6A00]">
            {hasUnread && <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse" />}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
