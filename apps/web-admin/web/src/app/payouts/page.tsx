"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutsApi, type AdminPayout } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

function centsToDisplay(cents: number) {
  return (cents / 100).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED:  "bg-green-100 text-green-800",
  FAILED:     "bg-red-100 text-red-800",
  CANCELLED:  "bg-zinc-100 text-zinc-600",
};

function CompleteModal({
  payout,
  onClose,
  onConfirm,
  loading,
}: {
  payout: AdminPayout;
  onClose: () => void;
  onConfirm: (ref: string) => void;
  loading: boolean;
}) {
  const [ref, setRef] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Marcar pago como completado</h2>
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-1 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Artista</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{payout.artistName || payout.artistId.slice(0, 8)}</span>
          </div>
          {payout.bookingCode && (
            <div className="flex justify-between text-zinc-500">
              <span>Reserva</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">#{payout.bookingCode}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-500">
            <span>Monto neto</span>
            <span className="font-bold text-[#FF6A00]">
              {payout.currency} {centsToDisplay(payout.netAmount ?? payout.amount)}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
            Referencia de transferencia *
          </label>
          <input
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Ej: TRX-2026-0512-001"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => ref.trim() && onConfirm(ref.trim())}
            disabled={!ref.trim() || loading}
            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
            ) : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayoutsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [completing, setCompleting] = useState<AdminPayout | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-payouts", statusFilter],
    queryFn: () => payoutsApi.list({ status: statusFilter || undefined, limit: 100 }),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) => payoutsApi.complete(id, ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      setCompleting(null);
    },
  });

  const payouts: AdminPayout[] = data?.payouts ?? (data?.data as AdminPayout[] | undefined) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pagos a Artistas</h1>
            <p className="text-sm text-zinc-500 mt-1">Gestiona los pagos pendientes y registra las transferencias realizadas.</p>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["PENDING", "COMPLETED", ""].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  statusFilter === s
                    ? "bg-[#FF6A00] border-[#FF6A00] text-white"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {s === "PENDING" ? "Pendientes" : s === "COMPLETED" ? "Completados" : "Todos"}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 dark:bg-red-950/30 dark:border-red-900">
              Error al cargar los pagos.
            </div>
          ) : payouts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center">
              <p className="text-sm font-medium text-zinc-500">Sin pagos {statusFilter === "PENDING" ? "pendientes" : ""}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <th className="px-5 py-3 text-left">Artista</th>
                    <th className="px-5 py-3 text-left">Reserva</th>
                    <th className="px-5 py-3 text-right">Monto bruto</th>
                    <th className="px-5 py-3 text-right">Comisión</th>
                    <th className="px-5 py-3 text-right">Monto neto</th>
                    <th className="px-5 py-3 text-left">Estado</th>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-left">Referencia</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                        {p.artistName || p.artistId.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500">
                        {p.bookingCode ? `#${p.bookingCode}` : p.bookingId?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-700 dark:text-zinc-300 font-mono">
                        {p.currency} {centsToDisplay(p.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-500 font-mono">
                        {p.platformFee != null ? `${p.currency} ${centsToDisplay(p.platformFee)}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#FF6A00] font-mono">
                        {p.currency} {centsToDisplay(p.netAmount ?? p.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs max-w-[120px] truncate">
                        {p.transferReference ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.status === "PENDING" && (
                          <button
                            onClick={() => setCompleting(p)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            Marcar pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {completing && (
        <CompleteModal
          payout={completing}
          onClose={() => setCompleting(null)}
          onConfirm={(ref) => completeMutation.mutate({ id: completing.id, ref })}
          loading={completeMutation.isPending}
        />
      )}
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <AdminGuard>
      <PayoutsContent />
    </AdminGuard>
  );
}
