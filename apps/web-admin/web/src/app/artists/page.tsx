"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { artistsApi, type AdminArtistRow } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "false", label: "Pendientes" },
  { value: "true", label: "Verificados" },
];

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        verified
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
      }`}
    >
      {verified ? (
        <>
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Verificado
        </>
      ) : (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          Pendiente
        </>
      )}
    </span>
  );
}

function ArtistsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [verified, setVerified] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    artist: AdminArtistRow;
    approve: boolean;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artists", page, verified],
    queryFn: () => artistsApi.list({ page, limit: 20, verified }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      artistsApi.verify(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setConfirmAction(null);
    },
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Artistas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revisión y verificación de perfiles de artistas
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900 sm:w-fit">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setVerified(opt.value); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              verified === opt.value
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
            {data?.artists.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{a.nombreArtistico}</p>
                    <p className="truncate text-xs text-zinc-400">{a.email}</p>
                  </div>
                  <VerifiedBadge verified={a.isVerified} />
                </div>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{a.categoria}</span>
                  {a.rating != null && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {a.rating.toFixed(1)}
                    </span>
                  )}
                  <span>{a.totalBookings ?? 0} reservas</span>
                </div>
                {!a.isVerified ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction({ artist: a, approve: true })} className="flex-1 rounded-lg bg-green-50 py-2 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400">Aprobar</button>
                    <button onClick={() => setConfirmAction({ artist: a, approve: false })} className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400">Rechazar</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmAction({ artist: a, approve: false })} className="w-full rounded-lg bg-zinc-100 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">Revocar verificación</button>
                )}
              </div>
            ))}
            {data?.artists.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-400">No se encontraron artistas con este filtro</p>
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
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Artista
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Categoría
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Rating
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Reservas
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Estado
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data?.artists.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {a.nombreArtistico}
                      </p>
                      <p className="text-xs text-zinc-400">{a.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {a.categoria}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.rating != null ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {a.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.totalBookings ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <VerifiedBadge verified={a.isVerified} />
                  </td>
                  <td className="px-5 py-3.5">
                    {!a.isVerified ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmAction({ artist: a, approve: true })}
                          className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => setConfirmAction({ artist: a, approve: false })}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmAction({ artist: a, approve: false })}
                        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        Revocar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.artists.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                    No se encontraron artistas con este filtro
                  </td>
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
            {data.total} artistas — página {data.page} de {data.totalPages}
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

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {confirmAction.approve
                ? "¿Verificar artista?"
                : confirmAction.artist.isVerified
                ? "¿Revocar verificación?"
                : "¿Rechazar solicitud?"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {confirmAction.approve
                ? `${confirmAction.artist.nombreArtistico} aparecerá con el ícono de verificado y podrá recibir reservas.`
                : confirmAction.artist.isVerified
                ? `${confirmAction.artist.nombreArtistico} perderá el badge de verificado.`
                : `Se rechazará la solicitud de ${confirmAction.artist.nombreArtistico}.`}
            </p>
            {verifyMutation.isError && (
              <p className="mt-3 text-xs text-red-500">
                {(verifyMutation.error as Error).message}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  verifyMutation.mutate({
                    id: confirmAction.artist.id,
                    approved: confirmAction.approve,
                  })
                }
                disabled={verifyMutation.isPending}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  confirmAction.approve
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {verifyMutation.isPending
                  ? "Procesando…"
                  : confirmAction.approve
                  ? "Verificar"
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <AdminGuard>
      <ArtistsContent />
    </AdminGuard>
  );
}
