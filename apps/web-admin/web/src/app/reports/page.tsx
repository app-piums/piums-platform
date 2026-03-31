"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reportsApi,
  disputesApi,
  type AdminReportRow,
  type DisputeRow,
} from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

// ─── Reportes (reseñas) ──────────────────────────────────────────────────────

const ESTADOS_REPORTE = [
  { value: "pending", label: "Pendientes" },
  { value: "", label: "Todos" },
  { value: "resolved", label: "Resueltos" },
  { value: "dismissed", label: "Descartados" },
];

const ESTADO_REPORTE_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  DISMISSED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  // lowercase fallback
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  dismissed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  OFFENSIVE: "Contenido ofensivo",
  INAPPROPRIATE: "Contenido inapropiado",
  FAKE: "Falso o engañoso",
  OTHER: "Otro motivo",
};

// ─── Quejas (disputas de reservas) ───────────────────────────────────────────

const DISPUTE_FILTER_TABS = [
  { value: "OPEN", label: "Abiertas" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "ESCALATED", label: "Escaladas" },
  { value: "", label: "Todas" },
  { value: "RESOLVED", label: "Resueltas" },
];

const DISPUTE_STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  IN_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  AWAITING_INFO: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  ESCALATED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  CLOSED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_REVIEW: "En revisión",
  AWAITING_INFO: "Esperando info",
  ESCALATED: "Escalada",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  CANCELLATION: "Cancelación",
  QUALITY: "Calidad",
  REFUND: "Reembolso",
  NO_SHOW: "No se presentó",
  ARTIST_NO_SHOW: "Artista no se presentó",
  PRICING: "Precio",
  BEHAVIOR: "Comportamiento",
  OTHER: "Otro",
};

const RESOLUTION_OPTIONS = [
  { value: "FULL_REFUND", label: "Reembolso completo" },
  { value: "PARTIAL_REFUND", label: "Reembolso parcial" },
  { value: "NO_REFUND", label: "Sin reembolso" },
  { value: "CREDIT", label: "Crédito para futura reserva" },
  { value: "WARNING", label: "Advertencia" },
  { value: "SUSPENSION", label: "Suspensión temporal" },
  { value: "BAN", label: "Expulsión permanente" },
  { value: "NO_ACTION", label: "Sin acción" },
];

const QUICK_STATUS_OPTIONS = [
  { value: "IN_REVIEW", label: "Marcar en revisión" },
  { value: "AWAITING_INFO", label: "Solicitar información" },
  { value: "ESCALATED", label: "Escalar" },
];

// ─── Modales ─────────────────────────────────────────────────────────────────

function ResolveReportModal({
  report,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  report: AdminReportRow;
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
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Resolver reporte
        </h3>
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            {REPORT_REASON_LABELS[report.reason] ?? report.reason}
          </p>
          <p className="mt-1 text-zinc-500">{report.description}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Reportado por: <span className="font-mono">{report.reportedBy.slice(0, 12)}</span>
            {report.review && (
              <> · Reseña: <span className="font-mono">{report.reviewId.slice(0, 8)}</span></>
            )}
          </p>
        </div>
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
function ResolveDisputeModal({
  dispute,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  dispute: DisputeRow;
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
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Resolver queja
        </h3>
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">{dispute.subject}</p>
          <p className="mt-1 text-zinc-500 line-clamp-3">{dispute.description}</p>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            Reserva: {dispute.bookingId.slice(0, 8)}…
          </p>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Resolución
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {RESOLUTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {showRefund && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monto a reembolsar (USD, opcional)
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
            onClick={() =>
              onSubmit(
                resolution,
                notes,
                refundAmount ? parseInt(refundAmount) : undefined
              )
            }
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

// ─── Sección Reportes ─────────────────────────────────────────────────────────

function ReportesSection() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("pending");
  const [resolving, setResolving] = useState<AdminReportRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", page, estado],
    queryFn: () => reportsApi.list({ page, limit: 20, estado }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: "resolved" | "dismissed";
      notes?: string;
    }) => reportsApi.resolve(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setResolving(null);
    },
  });

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 w-fit dark:border-zinc-800 dark:bg-zinc-900">
        {ESTADOS_REPORTE.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setEstado(opt.value); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              estado === opt.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
        </div>
      ) : data?.reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm text-zinc-400">
            {estado === "pending" ? "No hay reportes pendientes — ¡todo limpio!" : "No se encontraron reportes con este filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Reseña
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${ESTADO_REPORTE_STYLES[r.status] ?? ESTADO_REPORTE_STYLES.PENDING}`}>
                      {r.status === 'PENDING' ? 'Pendiente' : r.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{r.description}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Por: <span className="font-mono">{r.reportedBy.slice(0, 12)}</span>{" "}
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>{" "}
                    Reseña: <span className="font-mono">{r.reviewId.slice(0, 8)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    href={`/reports/reviews/${r.id}`}
                    className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 text-center"
                  >
                    Contactar
                  </Link>
                  {r.status === "PENDING" && (
                    <button
                      onClick={() => setResolving(r)}
                      className="rounded-lg bg-[#FF6A00]/10 px-4 py-2 text-sm font-medium text-[#FF6A00] hover:bg-[#FF6A00]/20 transition-colors"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>{data.total} reportes — página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800">← Anterior</button>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800">Siguiente →</button>
          </div>
        </div>
      )}

      {resolving && (
        <ResolveReportModal
          report={resolving}
          onClose={() => setResolving(null)}
          onSubmit={(action, notes) => resolveMutation.mutate({ id: resolving.id, action, notes })}
          isPending={resolveMutation.isPending}
          error={resolveMutation.isError ? (resolveMutation.error as Error).message : null}
        />
      )}

    </>
  );
}

// ─── Sección Quejas ───────────────────────────────────────────────────────────

function QuejasSection() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [resolving, setResolving] = useState<DisputeRow | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<{ dispute: DisputeRow; newStatus: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes", page, statusFilter],
    queryFn: () => disputesApi.list({ page, limit: 20, status: statusFilter }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, notes, refundAmount }: { id: string; resolution: string; notes: string; refundAmount?: number }) =>
      disputesApi.resolve(id, resolution, notes, refundAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      setResolving(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      disputesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      setStatusUpdating(null);
    },
  });

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 w-fit dark:border-zinc-800 dark:bg-zinc-900">
        {DISPUTE_FILTER_TABS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
        </div>
      ) : data?.disputes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm text-zinc-400">
            {statusFilter === "OPEN" ? "No hay quejas abiertas — ¡todo limpio!" : "No se encontraron quejas con este filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.disputes.map((d) => {
            const canAct = !["RESOLVED", "CLOSED"].includes(d.status);
            return (
              <div key={d.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DISPUTE_STATUS_STYLES[d.status] ?? DISPUTE_STATUS_STYLES.OPEN}`}>
                        {DISPUTE_STATUS_LABELS[d.status] ?? d.status}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {DISPUTE_TYPE_LABELS[d.disputeType] ?? d.disputeType}
                      </span>
                      {d.priority > 0 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                          Prioridad {d.priority}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {new Date(d.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">{d.subject}</p>
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{d.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                      <span>Reserva: <span className="font-mono">{d.bookingId.slice(0, 8)}</span></span>
                      <span className="text-zinc-300 dark:text-zinc-600">·</span>
                      <span>Reportado por: <span className="font-mono">{d.reportedBy.slice(0, 8)}</span></span>
                    </div>
                    {d.resolution && (
                      <p className="mt-2 text-xs text-zinc-400">
                        Resolución: <span className="font-medium text-zinc-600 dark:text-zinc-300">{d.resolution}</span>
                        {d.resolutionNotes && ` — ${d.resolutionNotes}`}
                      </p>
                    )}
                  </div>
                  {canAct && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <Link
                        href={`/reports/disputes/${d.id}`}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 text-center"
                      >
                        Mensajes
                      </Link>
                      <button
                        onClick={() => setResolving(d)}
                        className="rounded-lg bg-[#FF6A00]/10 px-4 py-2 text-sm font-medium text-[#FF6A00] hover:bg-[#FF6A00]/20 transition-colors"
                      >
                        Resolver
                      </button>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setStatusUpdating({ dispute: d, newStatus: e.target.value });
                            e.target.value = "";
                          }
                        }}
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600 focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <option value="">Cambiar estado…</option>
                        {QUICK_STATUS_OPTIONS.filter((o) => o.value !== d.status).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && (data.pagination?.totalPages ?? 0) > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>{data.pagination.total} quejas — página {data.pagination.page} de {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800">← Anterior</button>
            <button disabled={page >= (data.pagination?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolving && (
        <ResolveDisputeModal
          dispute={resolving}
          onClose={() => setResolving(null)}
          onSubmit={(resolution, notes, refundAmount) =>
            resolveMutation.mutate({ id: resolving.id, resolution, notes, refundAmount })
          }
          isPending={resolveMutation.isPending}
          error={resolveMutation.isError ? (resolveMutation.error as Error).message : null}
        />
      )}

      {/* Confirm status change */}
      {statusUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Cambiar estado
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              ¿Cambiar la queja <span className="font-mono font-medium">{statusUpdating.dispute.subject.slice(0, 30)}…</span> a{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {DISPUTE_STATUS_LABELS[statusUpdating.newStatus] ?? statusUpdating.newStatus}
              </span>?
            </p>
            {statusMutation.isError && (
              <p className="mt-2 text-xs text-red-500">{(statusMutation.error as Error).message}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setStatusUpdating(null)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: statusUpdating.dispute.id, status: statusUpdating.newStatus })}
                disabled={statusMutation.isPending}
                className="flex-1 rounded-lg bg-[#FF6A00] py-2 text-sm font-medium text-white hover:bg-[#E65F00] disabled:opacity-60"
              >
                {statusMutation.isPending ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

function ModerationContent() {
  const [section, setSection] = useState<"reportes" | "quejas">("reportes");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Moderación</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestión de reportes de reseñas y quejas de reservas
        </p>

        {/* Section toggle */}
        <div className="mt-5 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 w-fit dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setSection("reportes")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              section === "reportes"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Reportes de reseñas
          </button>
          <button
            onClick={() => setSection("quejas")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              section === "quejas"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Quejas de reservas
          </button>
        </div>
      </div>

      {section === "reportes" ? <ReportesSection /> : <QuejasSection />}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AdminGuard>
      <ModerationContent />
    </AdminGuard>
  );
}
