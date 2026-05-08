"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type AdminUserRow } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const ROLES = ["", "cliente", "artista", "admin"];
const PROVIDERS = ["", "email", "google", "facebook", "tiktok"];
const PROVIDER_LABELS: Record<string, string> = {
  "": "Todos los orígenes",
  email: "Email / Contraseña",
  google: "Google",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const CATEGORIES = ["", "MUSICO", "FOTOGRAFO", "VIDEOGRAFO", "ANIMADOR"];
const CATEGORY_LABELS: Record<string, string> = {
  "": "Todas las categorías",
  MUSICO: "Músico",
  FOTOGRAFO: "Fotógrafo",
  VIDEOGRAFO: "Videógrafo",
  ANIMADOR: "Animador",
};

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        blocked
          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${blocked ? "bg-red-500" : "bg-green-500"}`} />
      {blocked ? "Bloqueado" : "Activo"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    artista: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    cliente: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        styles[role] ?? styles.cliente
      }`}
    >
      {role}
    </span>
  );
}

function UsersContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState<AdminUserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await usersApi.exportCSV({ role, provider, search, category });
    } catch (err) {
      console.error("Error exportando CSV:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, role, provider, category],
    queryFn: () => usersApi.list({ page, limit: 20, search, role, provider, category }),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmBlock(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDelete(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestión de cuentas de clientes, artistas y administradores
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-medium text-white hover:bg-[#E65F00]"
          >
            Buscar
          </button>
        </form>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); if (e.target.value !== "artista") setCategory(""); }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "" ? "Todos los roles" : r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={provider}
          onChange={(e) => { setProvider(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p]}
            </option>
          ))}
        </select>
        {role === "artista" && (
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isExporting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {isExporting ? "Exportando…" : "Exportar CSV"}
        </button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {data?.users.map((u) => (
              <div key={u.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{u.nombre}</p>
                    <p className="truncate text-xs text-zinc-400">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge blocked={u.isBlocked} />
                    <span className="text-xs text-zinc-400">{new Date(u.createdAt).toLocaleDateString("es-MX")}</span>
                  </div>
                  {u.role !== "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmBlock(u)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          u.isBlocked
                            ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                            : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                        }`}
                      >
                        {u.isBlocked ? "Desbloquear" : "Bloquear"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-red-500 dark:hover:text-white"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {data?.users.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-400">No se encontraron usuarios</p>
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
                  Usuario
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Rol
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Estado
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Registrado
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Último acceso
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data?.users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {u.nombre}
                      </p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge blocked={u.isBlocked} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString("es-MX")
                      : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.role !== "admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmBlock(u)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            u.isBlocked
                              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                              : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                          }`}
                        >
                          {u.isBlocked ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-red-500 dark:hover:text-white"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data?.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                    No se encontraron usuarios
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
            {data.total} usuarios — página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Anterior
            </button>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {confirmBlock.isBlocked ? "¿Desbloquear usuario?" : "¿Bloquear usuario?"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {confirmBlock.isBlocked
                ? `${confirmBlock.nombre} podrá volver a acceder a la plataforma.`
                : `${confirmBlock.nombre} perderá acceso a la plataforma.`}
            </p>
            {blockMutation.isError && (
              <p className="mt-3 text-xs text-red-500">
                {(blockMutation.error as Error).message}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmBlock(null)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => blockMutation.mutate(confirmBlock.id)}
                disabled={blockMutation.isPending}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  confirmBlock.isBlocked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {blockMutation.isPending
                  ? "Procesando…"
                  : confirmBlock.isBlocked
                  ? "Desbloquear"
                  : "Bloquear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              ¿Eliminar usuario?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {confirmDelete.nombre} ({confirmDelete.email}) se eliminará de forma permanente, junto con su perfil de artista (si aplica).
            </p>
            <p className="mt-2 text-xs font-medium text-red-600">Esta acción no se puede deshacer.</p>
            {deleteMutation.isError && (
              <p className="mt-3 text-xs text-red-500">
                {(deleteMutation.error as Error).message}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}
