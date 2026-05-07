"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creditsApi, type AdminCreditRow } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

function centsToDisplay(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpiringSoon(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400",
  USED:      "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
  EXPIRED:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  USED: "Usado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

const REASON_LABELS: Record<string, string> = {
  NO_SHOW_COMPENSATION: "Compensación no-show",
  PROMO: "Promoción",
  MANUAL: "Manual",
  REFUND_CREDIT: "Crédito por reembolso",
};

function CancelModal({
  credit,
  onClose,
  onConfirm,
  loading,
}: {
  credit: AdminCreditRow;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Cancelar crédito</h2>
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>ID</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{credit.id.slice(0, 12)}…</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Usuario</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">{credit.userId.slice(0, 12)}…</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Monto</span>
            <span className="font-bold text-[#FF6A00]">{credit.currency} {centsToDisplay(credit.amount)}</span>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          ¿Confirmas que deseas cancelar este crédito? El usuario ya no podrá usarlo.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Cancelando…</>
            ) : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<AdminCreditRow | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-credits", statusFilter, userIdFilter, page],
    queryFn: () =>
      creditsApi.list({
        status: statusFilter || undefined,
        userId: userIdFilter.trim() || undefined,
        page,
        limit: 25,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => creditsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-credits"] });
      setCancelling(null);
    },
  });

  const credits: AdminCreditRow[] = data?.data?.credits ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.totalPages ?? 1;

  const totalActive = statusFilter === "ACTIVE" ? credits.reduce((s, c) => s + c.amount, 0) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Créditos</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Créditos de compensación emitidos a clientes (ej. no-show, promociones).
            </p>
          </div>

          {/* Summary card — shown when filtering active */}
          {statusFilter === "ACTIVE" && !isLoading && credits.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Total activo</p>
                <p className="text-2xl font-bold text-[#FF6A00]">USD {centsToDisplay(totalActive)}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Créditos activos (pág.)</p>
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{credits.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Total registros</p>
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{total}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2 flex-wrap">
              {["ACTIVE", "USED", "EXPIRED", "CANCELLED", ""].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    statusFilter === s
                      ? "bg-[#FF6A00] border-[#FF6A00] text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {s === "" ? "Todos" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              placeholder="Filtrar por User ID…"
              className="ml-auto w-64 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 dark:bg-red-950/30 dark:border-red-900">
              Error al cargar los créditos.
            </div>
          ) : credits.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center">
              <p className="text-sm font-medium text-zinc-500">
                Sin créditos {statusFilter ? STATUS_LABELS[statusFilter]?.toLowerCase() + "s" : ""}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Usuario</th>
                    <th className="px-5 py-3 text-left">Reserva</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                    <th className="px-5 py-3 text-left">Motivo</th>
                    <th className="px-5 py-3 text-left">Estado</th>
                    <th className="px-5 py-3 text-left">Expira</th>
                    <th className="px-5 py-3 text-left">Creado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {credits.map((c) => {
                    const expiringSoon = c.status === "ACTIVE" && isExpiringSoon(c.expiresAt);
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
                          {c.id.slice(0, 8)}…
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-400 max-w-[120px] truncate">
                          {c.userId.slice(0, 12)}…
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 text-xs font-mono">
                          {c.bookingId ? c.bookingId.slice(0, 8) + "…" : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold font-mono text-[#FF6A00]">
                          {c.currency} {centsToDisplay(c.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {REASON_LABELS[c.reason] ?? c.reason}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[c.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={expiringSoon ? "text-amber-600 font-semibold" : "text-zinc-500"}>
                            {formatDate(c.expiresAt)}
                            {expiringSoon && <span className="ml-1 text-xs">(pronto)</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.status === "ACTIVE" && (
                            <button
                              onClick={() => setCancelling(c)}
                              className="px-3 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{total} registro{total !== 1 ? "s" : ""}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1.5 text-zinc-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {cancelling && (
        <CancelModal
          credit={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={() => cancelMutation.mutate(cancelling.id)}
          loading={cancelMutation.isPending}
        />
      )}
    </div>
  );
}

export default function CreditsPage() {
  return (
    <AdminGuard>
      <CreditsContent />
    </AdminGuard>
  );
}
