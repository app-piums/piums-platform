"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { reportsApi } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  RESOLVED:  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  DISMISSED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDING:   "Pendiente",
  RESOLVED:  "Resuelto",
  DISMISSED: "Descartado",
};

const REASON_LABELS: Record<string, string> = {
  SPAM:          "Spam",
  OFFENSIVE:     "Contenido ofensivo",
  INAPPROPRIATE: "Contenido inapropiado",
  FAKE:          "Falso o engañoso",
  OTHER:         "Otro motivo",
};

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

function ResolveModal({
  reason,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  reason: string;
  onClose: () => void;
  onSubmit: (action: "resolved" | "dismissed", notes: string) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [action, setAction] = useState<"resolved" | "dismissed">("resolved");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Resolver reporte</h3>
        <p className="mt-2 text-sm text-zinc-500">{REASON_LABELS[reason] ?? reason}</p>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Acción</p>
          <div className="flex gap-2">
            <button
              onClick={() => setAction("resolved")}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                action === "resolved"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-700"
              }`}
            >
              Resolver
            </button>
            <button
              onClick={() => setAction("dismissed")}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                action === "dismissed"
                  ? "border-zinc-500 bg-zinc-100 text-zinc-700 dark:bg-zinc-800"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-700"
              }`}
            >
              Descartar
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notas internas (opcional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: se tomaron acciones sobre la cuenta del usuario…"
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
            onClick={() => onSubmit(action, notes)}
            disabled={isPending}
            className="flex-1 rounded-lg bg-[#FF6A00] py-2 text-sm font-medium text-white hover:bg-[#E65F00] disabled:opacity-60"
          >
            {isPending ? "Procesando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function ReportDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvePending, setResolvePending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages (report details come from the messages endpoint which also returns context)
    reportsApi.getMessages(id)
      .then((data: any) => {
        setMessages(data.messages ?? []);
        // If the endpoint returns report context
        if (data.report) setReport(data.report);
      })
      .catch((err: any) => setError(err?.message ?? "Error al cargar el reporte"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isResolved = report && report.status !== "PENDING";

  const grouped: { date: string; messages: any[] }[] = [];
  messages.forEach((m) => {
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
      const msg = await reportsApi.addMessage(id, newMsg.trim());
      setMessages((prev) => [...prev, { ...msg, senderType: "staff" }]);
      setNewMsg("");
    } catch (e: any) {
      setSendError(e?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (action: "resolved" | "dismissed", notes: string) => {
    setResolveError(null);
    setResolvePending(true);
    try {
      await reportsApi.resolve(id, action, notes);
      setReport((prev: any) => ({ ...prev, status: action === "resolved" ? "RESOLVED" : "DISMISSED" }));
      setResolving(false);
    } catch (e: any) {
      setResolveError(e?.message ?? "Error al resolver");
    } finally {
      setResolvePending(false);
    }
  };

  const statusCfg = report
    ? { label: ESTADO_LABELS[report.status] ?? report.status, className: ESTADO_STYLES[report.status] ?? "bg-zinc-100 text-zinc-600" }
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
          {statusCfg && report ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {REASON_LABELS[report.reason] ?? report.reason}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{loading ? "Cargando…" : "Detalle de reporte"}</p>
          )}
        </div>

        {loading && (
          <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin shrink-0" />
        )}

        {report && !isResolved && (
          <button
            onClick={() => setResolving(true)}
            className="shrink-0 rounded-lg bg-[#FF6A00]/10 px-3 py-1.5 text-xs font-medium text-[#FF6A00] hover:bg-[#FF6A00]/20 transition-colors"
          >
            Resolver
          </button>
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
      ) : (
        <>
          {/* Info strip */}
          <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                Reporte de reseña
              </span>
              {report?.reviewId && (
                <span className="text-xs font-mono text-zinc-400">#{report.reviewId.slice(0, 8)}</span>
              )}
              {report?.createdAt && (
                <>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(report.createdAt).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </>
              )}
            </div>
            {report?.description && (
              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{report.description}</p>
            )}
            {report?.reportedBy && (
              <p className="text-xs text-zinc-400 mt-1">
                Reportado por: <span className="font-mono">{report.reportedBy.slice(0, 12)}</span>
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-6">
              {messages.length === 0 ? (
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

          {/* Resolved banner */}
          {isResolved && (
            <div className="shrink-0 px-5 pb-3">
              <div className="max-w-3xl mx-auto flex items-center gap-2.5 rounded-xl px-4 py-3 border
                ${report.status === 'RESOLVED'
                  ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}">
                <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {report.status === "RESOLVED" ? "Este reporte ha sido resuelto." : "Este reporte fue descartado."}
                </p>
              </div>
            </div>
          )}

          {/* Compose */}
          {!isResolved && (
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
      )}

      {resolving && (
        <ResolveModal
          reason={report?.reason ?? ""}
          onClose={() => { setResolving(false); setResolveError(null); }}
          onSubmit={handleResolve}
          isPending={resolvePending}
          error={resolveError}
        />
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <AdminGuard>
      <ReportDetailContent />
    </AdminGuard>
  );
}
