"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi, type AdminReportRow } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const ESTADOS = [
  { value: "pending", label: "Pendientes" },
  { value: "", label: "Todos" },
  { value: "resolved", label: "Resueltos" },
  { value: "dismissed", label: "Descartados" },
];

const ESTADO_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  dismissed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const TARGET_LABELS: Record<string, string> = {
  user: "Usuario",
  artist: "Artista",
  booking: "Reserva",
};

function ResolveModal({
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
            {report.motivo}
          </p>
          <p className="mt-1 text-zinc-500">{report.descripcion}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Reportado por: {report.reporterNombre} ({report.reporterEmail})
          </p>
        </div>

        {/* Action */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Acción
          </p>
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

        {/* Notes */}
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

        {error && (
          <p className="mt-3 text-xs text-red-500">{error}</p>
        )}

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

function ReportsContent() {
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reportes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cola de moderación — reportes enviados por usuarios de la plataforma
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 w-fit dark:border-zinc-800 dark:bg-zinc-900">
        {ESTADOS.map((opt) => (
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

      {/* Cards */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
        </div>
      ) : data?.reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg
            className="mx-auto h-10 w-10 text-zinc-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-3 text-sm text-zinc-400">
            {estado === "pending"
              ? "No hay reportes pendientes — ¡todo limpio!"
              : "No se encontraron reportes con este filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reports.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {TARGET_LABELS[r.targetType] ?? r.targetType}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        ESTADO_STYLES[r.estado] ?? ESTADO_STYLES.pending
                      }`}
                    >
                      {r.estado}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {r.motivo}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                    {r.descripcion}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Por: {r.reporterNombre}{" "}
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>{" "}
                    Target ID: <span className="font-mono">{r.targetId.slice(0, 8)}</span>
                  </p>
                </div>
                {r.estado === "pending" && (
                  <button
                    onClick={() => setResolving(r)}
                    className="shrink-0 rounded-lg bg-[#FF6A00]/10 px-4 py-2 text-sm font-medium text-[#FF6A00] hover:bg-[#FF6A00]/20 transition-colors"
                  >
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            {data.total} reportes — página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolving && (
        <ResolveModal
          report={resolving}
          onClose={() => setResolving(null)}
          onSubmit={(action, notes) =>
            resolveMutation.mutate({ id: resolving.id, action, notes })
          }
          isPending={resolveMutation.isPending}
          error={
            resolveMutation.isError
              ? (resolveMutation.error as Error).message
              : null
          }
        />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AdminGuard>
      <ReportsContent />
    </AdminGuard>
  );
}
