"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { disputesApi } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISPUTE_STATUS_STYLES: Record<string, string> = {
  OPEN:          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  IN_REVIEW:     "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  AWAITING_INFO: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  ESCALATED:     "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  RESOLVED:      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  CLOSED:        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  OPEN:          "Abierta",
  IN_REVIEW:     "En revisión",
  AWAITING_INFO: "Esperando info",
  ESCALATED:     "Escalada",
  RESOLVED:      "Resuelta",
  CLOSED:        "Cerrada",
};

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  CANCELLATION:   "Cancelación",
  QUALITY:        "Calidad",
  REFUND:         "Reembolso",
  NO_SHOW:        "No se presentó",
  ARTIST_NO_SHOW: "Artista no se presentó",
  PRICING:        "Precio",
  BEHAVIOR:       "Comportamiento",
  OTHER:          "Otro",
};

const RESOLUTION_OPTIONS = [
  { value: "FULL_REFUND",     label: "Reembolso completo" },
  { value: "PARTIAL_REFUND",  label: "Reembolso parcial" },
  { value: "NO_REFUND",       label: "Sin reembolso" },
  { value: "CREDIT",          label: "Crédito para futura reserva" },
  { value: "WARNING",         label: "Advertencia" },
  { value: "SUSPENSION",      label: "Suspensión temporal" },
  { value: "BAN",             label: "Expulsión permanente" },
  { value: "NO_ACTION",       label: "Sin acción" },
];

const QUICK_STATUS_OPTIONS = [
  { value: "IN_REVIEW",     label: "Marcar en revisión" },
  { value: "AWAITING_INFO", label: "Solicitar información" },
  { value: "ESCALATED",     label: "Escalar" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Resolve modal ────────────────────────────────────────────────────────────

function ResolveDisputeModal({
  dispute,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  dispute: any;
  onClose: () => void;
  onSubmit: (resolution: string, notes: string, refundAmount?: number) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [resolution, setResolution] = useState("NO_ACTION");
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const showRefund = resolution === "FULL_REFUND" || resolution === "PARTIAL_REFUND";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Resolver queja</h3>
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">{dispute.subject}</p>
          <p className="mt-1 text-zinc-500 line-clamp-3">{dispute.description}</p>
          <p className="mt-2 text-xs text-zinc-400 font-mono">Reserva: {dispute.bookingId.slice(0, 8)}…</p>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Resolución</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {showRefund && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monto a reembolsar (MXN, opcional)
            </label>
            <input
              type="number"
              min={0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Ej: 500"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
        )}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notas de resolución <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explica la decisión tomada…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(resolution, notes, refundAmount ? parseInt(refundAmount) : undefined)}
            disabled={isPending || !notes.trim()}
            className="flex-1 rounded-lg bg-[#FF6A00] py-2 text-sm font-medium text-white hover:bg-[#E65F00] disabled:opacity-60"
          >
            {isPending ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail page content ──────────────────────────────────────────────────────

function DisputeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [dispute, setDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvePending, setResolvePending] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    disputesApi.getById(id)
      .then((data: any) => {
        setDispute(data);
        setMessages(data.messages ?? []);
      })
      .catch((err: any) => setError(err?.message ?? "Error al cargar la queja"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isActive = dispute && !["RESOLVED", "CLOSED"].includes(dispute.status);
  const isResolved = dispute && ["RESOLVED", "CLOSED"].includes(dispute.status);

  const visibleMessages = messages.filter((m) => !m.isStatusUpdate);

  const grouped: { date: string; messages: any[] }[] = [];
  visibleMessages.forEach((m) => {
    const day = new Date(m.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last?.date === day) last.messages.push(m);
    else grouped.push({ date: day, messages: [m] });
  });

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSendError(null);
    try {
      setSending(true);
      const msg = await disputesApi.addMessage(id, newMsg.trim());
      setMessages((prev) => [...prev, { ...msg, senderType: "staff" }]);
      setNewMsg("");
    } catch (e: any) {
      setSendError(e?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (resolution: string, notes: string, refundAmount?: number) => {
    setResolveError(null);
    setResolvePending(true);
    try {
      const updated = await disputesApi.resolve(id, resolution, notes, refundAmount);
      setDispute(updated.dispute ?? { ...dispute, status: "RESOLVED", resolution, resolutionNotes: notes });
      setResolving(false);
    } catch (e: any) {
      setResolveError(e?.message ?? "Error al resolver");
    } finally {
      setResolvePending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    try {
      const updated = await disputesApi.updateStatus(id, newStatus);
      setDispute(updated.dispute ?? { ...dispute, status: newStatus });
    } catch {
      // ignore — UI shows stale status
    } finally {
      setStatusChanging(false);
    }
  };

  const statusCfg = dispute
    ? { label: DISPUTE_STATUS_LABELS[dispute.status] ?? dispute.status, className: DISPUTE_STATUS_STYLES[dispute.status] ?? "bg-zinc-100 text-zinc-600" }
    : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link
          href="/reports"
          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{dispute.subject}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{loading ? "Cargando…" : "Detalle de queja"}</p>
          )}
        </div>

        {loading && (
          <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin shrink-0" />
        )}

        {/* Action buttons — only when loaded and active */}
        {dispute && isActive && (
          <div className="flex items-center gap-2 shrink-0">
            <select
              value=""
              disabled={statusChanging}
              onChange={(e) => { if (e.target.value) handleStatusChange(e.target.value); }}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 dark:bg-zinc-800 focus:border-[#FF6A00] focus:outline-none disabled:opacity-50"
            >
              <option value="">Cambiar estado…</option>
              {QUICK_STATUS_OPTIONS.filter((o) => o.value !== dispute.status).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setResolving(true)}
              className="rounded-lg bg-[#FF6A00]/10 px-3 py-1.5 text-xs font-medium text-[#FF6A00] hover:bg-[#FF6A00]/20 transition-colors"
            >
              Resolver
            </button>
          </div>
        )}
      </header>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-zinc-500">{error}</p>
          <Link href="/reports" className="text-sm text-[#FF6A00] hover:underline">← Volver a moderación</Link>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dispute ? (
        <>
          {/* Info strip */}
          <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                {DISPUTE_TYPE_LABELS[dispute.disputeType] ?? dispute.disputeType}
              </span>
              <span className="text-xs font-mono text-zinc-400">#{dispute.bookingId.slice(0, 8)}</span>
              <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-xs text-zinc-400">
                {new Date(dispute.createdAt).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              {dispute.priority > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                  Prioridad {dispute.priority}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {dispute.description}
            </p>
            {dispute.reportedBy && (
              <p className="text-xs text-zinc-400 mt-1">
                Reportado por: <span className="font-mono">{dispute.reportedBy.slice(0, 12)}</span>
                {dispute.reportedAgainst && (
                  <> · Contra: <span className="font-mono">{dispute.reportedAgainst.slice(0, 12)}</span></>
                )}
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-6">
              {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-500">Sin mensajes aún</p>
                    <p className="text-sm text-zinc-400 mt-1">Inicia el contacto con el cliente o artista.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {grouped.map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          {formatDateSeparator(group.messages[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        {group.messages.map((m, i) => {
                          const isStaff  = m.senderType === "staff";
                          const isClient = m.senderType === "client";
                          const prevMsg  = group.messages[i - 1];
                          const showLabel = !prevMsg || prevMsg.senderType !== m.senderType;
                          const nextMsg  = group.messages[i + 1];
                          const isLast  = !nextMsg || nextMsg.senderType !== m.senderType;

                          const senderLabel = isStaff  ? "Piums Support"
                                            : isClient ? "Cliente"
                                            : "Artista";

                          const bubbleClass = isStaff
                            ? `bg-[#FF6A00] text-white rounded-2xl ${isLast ? "rounded-tr-sm" : ""}`
                            : isClient
                            ? `bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-2xl ${isLast ? "rounded-tl-sm" : ""}`
                            : `bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 rounded-2xl ${isLast ? "rounded-tl-sm" : ""}`;

                          const timeClass = isStaff  ? "text-white/60"
                                          : isClient ? "text-zinc-400"
                                          : "text-indigo-400";

                          return (
                            <div key={m.id ?? i} className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}>
                              {showLabel && (
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 px-1 text-zinc-400">
                                  {senderLabel}
                                </p>
                              )}
                              <div className={`max-w-[70%] px-4 py-3 text-sm ${bubbleClass}`}>
                                <p className="leading-relaxed">{m.message}</p>
                                {m.createdAt && (
                                  <p className={`text-[10px] mt-1.5 ${timeClass}`}>
                                    {formatMsgTime(m.createdAt)}
                                  </p>
                                )}
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
            <div className="shrink-0 px-5 pb-3">
              <div className="max-w-3xl mx-auto flex items-center gap-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 px-4 py-3">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {dispute.status === "RESOLVED" ? "Esta queja ha sido resuelta." : "Esta queja fue cerrada."}
                    {dispute.resolution && (
                      <span className="ml-1 font-medium">{dispute.resolution.replace(/_/g, " ")}</span>
                    )}
                  </p>
                  {dispute.resolutionNotes && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{dispute.resolutionNotes}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Compose */}
          {isActive && (
            <div className="shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-5 py-3">
              <div className="max-w-3xl mx-auto">
                {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Escribe un mensaje al cliente/artista…"
                    autoFocus
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMsg.trim()}
                    className="px-4 py-2.5 bg-[#FF6A00] text-white rounded-xl text-sm font-medium hover:bg-[#E65F00] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Resolve modal */}
      {resolving && dispute && (
        <ResolveDisputeModal
          dispute={dispute}
          onClose={() => { setResolving(false); setResolveError(null); }}
          onSubmit={handleResolve}
          isPending={resolvePending}
          error={resolveError}
        />
      )}
    </div>
  );
}

export default function DisputeDetailPage() {
  return (
    <AdminGuard>
      <DisputeDetailContent />
    </AdminGuard>
  );
}
