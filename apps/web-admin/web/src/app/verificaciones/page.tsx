"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationsApi, type PendingVerificationUser } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const DOC_LABELS: Record<string, string> = {
  DPI: "DPI",
  PASSPORT: "Pasaporte",
  RESIDENCE_CARD: "Tarjeta de Residencia",
};

function DocImage({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="group relative block overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 w-full aspect-video hover:opacity-90 transition-opacity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white rounded px-1">{label}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function UserCard({
  user,
  onDecision,
  loading,
}: {
  user: PendingVerificationUser;
  onDecision: (id: string, approved: boolean, reason?: string) => void;
  loading: boolean;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{user.nombre}</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">{user.role}</span>
            {user.provider === "google" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">Google</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-400">Registrado</p>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {new Date(user.createdAt).toLocaleDateString("es-GT")}
          </p>
        </div>
      </div>

      {/* Document info */}
      {user.documentType && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">{DOC_LABELS[user.documentType] ?? user.documentType}</span>
          {user.documentNumber && <span className="ml-2 font-mono text-zinc-500">{user.documentNumber}</span>}
        </div>
      )}

      {/* Document photos */}
      <div className="grid grid-cols-3 gap-2">
        {user.documentFrontUrl && <DocImage url={user.documentFrontUrl} label="Frontal" />}
        {user.documentBackUrl && <DocImage url={user.documentBackUrl} label="Trasera" />}
        {user.documentSelfieUrl && <DocImage url={user.documentSelfieUrl} label="Selfie" />}
      </div>

      {/* Actions */}
      {showReject ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Motivo del rechazo (ej: imagen borrosa, documento expirado...)"
            rows={2}
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-400/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onDecision(user.id, false, reason)}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onDecision(user.id, true)}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            Aprobar
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerificacionesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["verifications", page],
    queryFn: () => verificationsApi.listPending({ page, limit: 12 }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) =>
      verificationsApi.verify(id, approved, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
    },
  });

  const handleDecision = (id: string, approved: boolean, reason?: string) => {
    mutation.mutate({ id, approved, reason });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Verificaciones de identidad</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Usuarios que han subido documentos y esperan aprobación.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(j => <div key={j} className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.users.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-zinc-500 font-medium">Sin verificaciones pendientes</p>
              <p className="text-zinc-400 text-sm mt-1">Todos los documentos han sido revisados.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-500">{data.total} pendiente{data.total !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.users.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onDecision={handleDecision}
                    loading={mutation.isPending}
                  />
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 text-sm text-zinc-500">
                  <span>{data.total} registros</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="px-3 py-1.5 text-zinc-400">{page} / {data.totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
