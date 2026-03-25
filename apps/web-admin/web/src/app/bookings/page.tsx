"use client";

import { useState, useEffect, useCallback } from "react";
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
  cancelado:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  disputa:    "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  // backend capitalised statuses
  pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  confirmed:  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  completed:  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelled:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function EstadoBadge({ estado }: { estado: string }) {
  const key = estado.toLowerCase();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        ESTADO_STYLES[key] ?? ESTADO_STYLES.cancelado
      }`}
    >
      {estado}
    </span>
  );
}

function MontoCell({ monto }: { monto: number | null | undefined }) {
  if (monto == null) return <span className="text-zinc-400">—</span>;
  return <span>Q{monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</span>;
}

/** Resaltar coincidencia de código PIU en el texto */
function Highlight({ text, query }: { text?: string; query: string }) {
  if (!text) return <span className="text-zinc-400">—</span>;
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-orange-200 text-orange-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function BookingsContent() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce de la búsqueda (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on estado change
  const handleEstado = useCallback((val: string) => {
    setEstado(val);
    setPage(1);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", page, estado, debouncedSearch],
    queryFn: () =>
      bookingsApi.list({ page, limit: 20, estado, search: debouncedSearch }),
  });

  // Filtrado cliente-side adicional por código PIU (por si el backend no lo soporta aún)
  const bookings = (data?.bookings ?? []).filter((b) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      (b.code ?? "").toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.clienteNombre.toLowerCase().includes(q) ||
      b.artistaNombre.toLowerCase().includes(q)
    );
  });

  const isEmpty = !isLoading && bookings.length === 0;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reservas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vista general de todas las reservas de la plataforma
        </p>
      </div>

      {/* ── Search bar ───────────────────────────────────── */}
      <div className="mb-5 relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código PIU (ej. PIU-XXXX), ID, cliente o artista..."
          className="w-full sm:max-w-md pl-10 pr-10 py-2.5 text-sm border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:w-fit">
        {ESTADOS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleEstado(opt.value)}
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

      {/* Resultados meta */}
      {!isLoading && debouncedSearch && (
        <p className="mb-3 text-xs text-zinc-400">
          {bookings.length} resultado{bookings.length !== 1 ? "s" : ""} para{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">"{debouncedSearch}"</span>
        </p>
      )}

      {/* ── Mobile cards ─────────────────────────────────── */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            {debouncedSearch ? `Sin resultados para "${debouncedSearch}"` : "No se encontraron reservas con este filtro"}
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{b.clienteNombre}</p>
                    <p className="truncate text-xs text-zinc-400">{b.clienteEmail}</p>
                  </div>
                  <EstadoBadge estado={b.estado} />
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  {b.code && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Código PIU</span>
                      <span className="font-mono font-medium text-[#FF6A00]">
                        <Highlight text={b.code} query={debouncedSearch} />
                      </span>
                    </div>
                  )}
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
          </div>
        )}
      </div>

      {/* ── Desktop table ────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white sm:block dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Código PIU</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Artista</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Servicio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Fecha evento</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Monto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isEmpty ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                    {debouncedSearch ? `Sin resultados para "${debouncedSearch}"` : "No se encontraron reservas con este filtro"}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-5 py-3.5">
                      {b.code ? (
                        <span className="font-mono text-xs font-semibold text-[#FF6A00]">
                          <Highlight text={b.code} query={debouncedSearch} />
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-zinc-400">#{b.id.slice(0, 8)}</span>
                      )}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {data && data.totalPages > 1 && !debouncedSearch && (
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
