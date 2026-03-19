"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "disputa", label: "En disputa" },
];

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  confirmado: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  completado: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelado: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  disputa: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        ESTADO_STYLES[estado] ?? ESTADO_STYLES.cancelado
      }`}
    >
      {estado}
    </span>
  );
}

function MontoCell({ monto }: { monto: number | null | undefined }) {
  if (monto == null) return <span className="text-zinc-400">—</span>;
  return <>${monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</>;
}

function BookingsContent() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", page, estado],
    queryFn: () => bookingsApi.list({ page, limit: 20, estado }),
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reservas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vista general de todas las reservas de la plataforma
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:w-fit">
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

      {/* Mobile cards */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {data?.bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{b.clienteNombre}</p>
                    <p className="truncate text-xs text-zinc-400">{b.clienteEmail}</p>
                  </div>
                  <EstadoBadge estado={b.estado} />
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Artista</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.artistaNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Servicio</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.servicio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Fecha</span>
                    <span>{new Date(b.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Monto</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50"><MontoCell monto={b.monto} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ID</span>
                    <span className="font-mono">#{b.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            ))}
            {data?.bookings.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-400">No se encontraron reservas con este filtro</p>
            )}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white sm:block dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Artista</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Servicio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Fecha evento</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Monto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data?.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">#{b.id.slice(0, 8)}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{b.clienteNombre}</p>
                    <p className="text-xs text-zinc-400">{b.clienteEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-700 dark:text-zinc-300">{b.artistaNombre}</td>
                  <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">{b.servicio}</td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500">
                    {new Date(b.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    <MontoCell monto={b.monto} />
                  </td>
                  <td className="px-5 py-3.5"><EstadoBadge estado={b.estado} /></td>
                </tr>
              ))}
              {data?.bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">No se encontraron reservas con este filtro</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            {data.total} reservas — página {data.page} de {data.totalPages}
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
    </div>
  );
}

export default function BookingsPage() {
  return (
    <AdminGuard>
      <BookingsContent />
    </AdminGuard>
  );
}
