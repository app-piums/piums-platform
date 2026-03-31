'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import { toast } from '@/lib/toast';

type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'AWAITING_INFO' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
type DisputeType   = 'CANCELLATION' | 'QUALITY' | 'REFUND' | 'NO_SHOW' | 'ARTIST_NO_SHOW' | 'PRICING' | 'BEHAVIOR' | 'OTHER';

const MY_SENDER_TYPE = 'client' as const;

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
  NO_SHOW:        'No Show (cliente)',
  ARTIST_NO_SHOW: 'Artista no se presentó',
  PRICING:        'Precio',
  BEHAVIOR:       'Comportamiento',
  OTHER:          'Otro',
};

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function QuejasDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [dispute, setDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/login?redirect=/quejas/${id}`); return; }

    sdk.getDisputeById(id)
      .then((data: any) => {
        setDispute(data);
        setMessages(data.messages ?? []);
      })
      .catch((err: any) => setError(err?.message || 'Error al cargar la queja'))
      .finally(() => setLoading(false));
  }, [authLoading, user, id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isActive = dispute && dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED';
  const isResolved = dispute && (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED');
  const visibleMessages = messages.filter(m => !m.isStatusUpdate);
  const statusCfg = dispute ? (STATUS_CONFIG[dispute.status as DisputeStatus] ?? STATUS_CONFIG.OPEN) : null;

  const grouped: { date: string; messages: any[] }[] = [];
  visibleMessages.forEach(m => {
    const day = new Date(m.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last?.date === day) last.messages.push(m);
    else grouped.push({ date: day, messages: [m] });
  });

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      setSending(true);
      const msg = await sdk.addDisputeMessage(id, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <ClientSidebar userName={userName} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <Link
            href="/quejas"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            {statusCfg && dispute ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
                <p className="text-sm font-semibold text-gray-900 truncate">{dispute.subject}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{loading ? 'Cargando…' : 'Detalle de queja'}</p>
            )}
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </header>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-gray-500">{error}</p>
            <Link href="/quejas" className="text-sm text-[#FF6A00] hover:underline">← Volver a mis quejas</Link>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dispute ? (
          <>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Dispute summary card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {statusCfg && (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          {TYPE_LABELS[dispute.disputeType as DisputeType] ?? dispute.disputeType}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{dispute.subject}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{dispute.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="font-mono">#{dispute.bookingId.slice(0, 8)}</span>
                        <span>·</span>
                        <span>
                          {new Date(dispute.createdAt).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-4 border-t border-gray-50 pt-3">
                    El equipo de Piums revisará tu caso y se pondrá en contacto a través de este chat.
                  </p>
                </div>

                {visibleMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Sin mensajes aún</p>
                      <p className="text-sm text-gray-400 mt-1">El equipo de Piums se pondrá en contacto pronto.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {grouped.map(group => (
                      <div key={group.date}>
                        <div className="flex items-center gap-3 my-6">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            {formatDateSeparator(group.messages[0].createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-0.5">
                          {group.messages.map((m, i) => {
                            const isMine = m.senderType === MY_SENDER_TYPE;
                            const isStaff = m.senderType === 'staff';
                            const prevMsg = group.messages[i - 1];
                            const showLabel = !prevMsg || prevMsg.senderType !== m.senderType;

                            const senderLabel = isMine ? 'Tú'
                              : isStaff ? 'Piums Support'
                              : m.senderType === 'client' ? 'Cliente'
                              : 'Artista';
                            const bubbleClass = isMine
                              ? 'bg-[#FF6A00] text-white rounded-2xl rounded-br-sm shadow-sm'
                              : isStaff
                              ? 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm'
                              : 'bg-white border border-indigo-100 text-indigo-900 rounded-2xl rounded-bl-sm shadow-sm';
                            const timeClass = isMine ? 'text-orange-100' : 'text-gray-400';

                            return (
                              <div key={m.id ?? i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
                                <div className="flex flex-col">
                                  {showLabel && !isMine && (
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 px-1 text-gray-400">
                                      {senderLabel}
                                    </p>
                                  )}
                                  <div className={`max-w-[72%] px-4 py-2.5 text-sm ${bubbleClass}`}>
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
                                    <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                      <span className={`text-xs ${timeClass}`}>
                                        {m.createdAt ? formatMsgTime(m.createdAt) : ''}
                                      </span>
                                      {isMine && <span className="text-xs text-orange-100">✓✓</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Resolution banner */}
            {isResolved && (
              <div className="shrink-0 px-4 pb-3">
                <div className="max-w-3xl mx-auto flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700">
                    {dispute.status === 'RESOLVED' ? 'Esta queja ha sido resuelta.' : 'Esta queja fue cerrada.'}
                  </p>
                </div>
              </div>
            )}

            {/* Compose */}
            {isActive && (
              <div className="shrink-0 border-t border-gray-200 bg-white">
                <div className="max-w-3xl mx-auto p-4">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Escribe un mensaje..."
                      rows={1}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] transition-colors text-sm"
                      style={{ maxHeight: '120px' }}
                      autoFocus
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMsg.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6A00] text-white rounded-xl hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
                    >
                      {sending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      <span className="hidden sm:inline text-sm">Enviar</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Presiona Enter para enviar, Shift + Enter para nueva línea</p>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
