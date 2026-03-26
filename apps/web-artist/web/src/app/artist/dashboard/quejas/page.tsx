'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
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
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; className: string }> = {
  OPEN:          { label: 'Abierta',        className: 'bg-red-100 text-red-700' },
  IN_REVIEW:     { label: 'En revisión',    className: 'bg-blue-100 text-blue-700' },
  AWAITING_INFO: { label: 'Info solicitada',className: 'bg-amber-100 text-amber-700' },
  ESCALATED:     { label: 'Escalada',       className: 'bg-purple-100 text-purple-700' },
  RESOLVED:      { label: 'Resuelta',       className: 'bg-green-100 text-green-700' },
  CLOSED:        { label: 'Cerrada',        className: 'bg-gray-100 text-gray-600' },
};

const TYPE_LABELS: Record<DisputeType, string> = {
  CANCELLATION:   'Cancelación',
  QUALITY:        'Calidad',
  REFUND:         'Reembolso',
  NO_SHOW:        'Cliente no se presentó',
  ARTIST_NO_SHOW: 'Artista no se presentó',
  PRICING:        'Precio',
  BEHAVIOR:       'Comportamiento',
  OTHER:          'Otro',
};

export default function ArtistQuejasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/artist/dashboard/quejas'); return; }

    (async () => {
      try {
        setLoading(true);
        const data = await sdk.getMyDisputes();
        setDisputes(data.asReporter ?? []);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar las quejas');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Mis Quejas</h1>
            <p className="text-gray-500 text-sm">Quejas enviadas sobre tus reservas</p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button onClick={() => location.reload()} className="text-sm text-red-500 underline">Reintentar</button>
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">Sin quejas registradas</p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Si tienes algún problema con una reserva, puedes reportarlo desde la sección de Reservas.
              </p>
              <Link href="/artist/dashboard/bookings" className="mt-2 text-sm font-medium text-orange-500 hover:underline">
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
      </main>
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<any[]>(dispute.messages ?? []);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const statusCfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.OPEN;
  const isActive = dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED';

  const handleExpand = async () => {
    if (!expanded && messages.length === 0) {
      try {
        setLoadingDetail(true);
        const data = await sdk.getDisputeById(dispute.id);
        setMessages(data.messages ?? []);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded(v => !v);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      setSending(true);
      const msg = await sdk.addDisputeMessage(dispute.id, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch {
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {TYPE_LABELS[dispute.disputeType] ?? dispute.disputeType}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{dispute.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(dispute.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{dispute.description}</p>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hilo de conversación</p>
            {loadingDetail ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.filter(m => !m.isStatusUpdate).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aún no hay mensajes de seguimiento.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {messages.filter(m => !m.isStatusUpdate).map((m) => (
                  <div key={m.id} className={`flex ${m.senderType === 'staff' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                      m.senderType === 'staff' ? 'bg-gray-100 text-gray-700' : 'bg-orange-500 text-white'
                    }`}>
                      {m.senderType === 'staff' && (
                        <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase">Piums Support</p>
                      )}
                      <p>{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isActive && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Agrega información adicional…"
                  className="flex-1 text-sm rounded-xl border border-gray-200 px-3.5 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 transition"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMsg.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {sending ? '…' : 'Enviar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
