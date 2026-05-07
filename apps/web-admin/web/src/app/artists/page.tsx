"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { artistsApi, commissionsApi, disputesApi, type AdminArtistRow, type AdminArtistDetail, type CommissionRule } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

const FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "false", label: "Pendientes" },
  { value: "true", label: "Verificados" },
];

const ARTIST_CATEGORIES = [
  { value: "", label: "Todas las categorías" },
  { value: "MUSICO", label: "Músico" },
  { value: "FOTOGRAFO", label: "Fotógrafo" },
  { value: "TATUADOR", label: "Tatuador" },
  { value: "MAQUILLADOR", label: "Maquillador" },
  { value: "DJ", label: "DJ" },
  { value: "PINTOR", label: "Pintor" },
  { value: "BAILARIN", label: "Bailarín" },
  { value: "VIDEOGRAFO", label: "Videógrafo" },
  { value: "DISENADOR", label: "Diseñador" },
  { value: "ANIMADOR", label: "Animador" },
  { value: "MAGO", label: "Mago" },
  { value: "ACROBATA", label: "Acróbata" },
  { value: "OTRO", label: "Otro" },
];

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        verified
          ? "bg-[#FF6A00]/15 text-[#FF6A00] dark:bg-[#FF6A00]/20 dark:text-[#FF8A33]"
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

// ─── Verification checklist item ───────────────────────────────────────────────
function CheckItem({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
      <div
        onClick={() => onChange(!checked)}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-[#FF6A00] bg-[#FF6A00]"
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
        }`}
      >
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={`text-sm leading-tight ${checked ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>
        {children}
      </span>
    </label>
  );
}

// ─── Artist Detail Drawer ──────────────────────────────────────────────────────
type Tab = "perfil" | "documentos" | "decision" | "comisiones" | "no-shows";

function ArtistDetailDrawer({
  artistId,
  onClose,
  onVerify,
  onReject,
}: {
  artistId: string;
  onClose: () => void;
  onVerify: (id: string, approved: boolean, reason?: string, notes?: string) => void;
  onReject: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AdminArtistDetail>({
    queryKey: ["admin-artist-detail", artistId],
    queryFn: () => artistsApi.detail(artistId),
  });

  const { data: commissionsData } = useQuery({
    queryKey: ["admin-commissions", artistId],
    queryFn: () => commissionsApi.list({ artistId }),
    enabled: !!artistId,
  });

  const { data: noShowsData } = useQuery({
    queryKey: ["admin-artist-no-shows", data?.authId],
    queryFn: () => disputesApi.list({ disputeType: "ARTIST_NO_SHOW", reportedAgainst: data!.authId }),
    enabled: !!data?.authId,
  });

  const [tab, setTab] = useState<Tab>("perfil");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [checks, setChecks] = useState({ identity: false, notExpired: false, selfie: false, readable: false });
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  // Commission form state
  const [commissionType, setCommissionType] = useState<"RATE_OVERRIDE" | "FIXED_PENALTY">("RATE_OVERRIDE");
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionFixed, setCommissionFixed] = useState("");
  const [commissionReason, setCommissionReason] = useState("");
  const [commissionStartDate, setCommissionStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [creatingCommission, setCreatingCommission] = useState(false);

  const shadowBanMutation = useMutation({
    mutationFn: ({ banned, reason }: { banned: boolean; reason?: string }) =>
      artistsApi.shadowBan(data!.authId ?? data!.id, banned, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artist-detail", artistId] });
    },
  });

  const hasDocuments = !!(data?.documentFrontUrl || data?.documentBackUrl || data?.documentSelfieUrl || data?.documentType);
  const allChecked = Object.values(checks).every(Boolean);

  const rules: CommissionRule[] = commissionsData?.data ?? [];
  const activeRules = rules.filter((r) => r.isActive);
  const noShowCount = noShowsData?.disputes.length ?? 0;

  const tabs: { key: Tab; label: string; dot?: boolean }[] = [
    { key: "perfil", label: "Perfil" },
    { key: "documentos", label: "Documentos", dot: hasDocuments },
    { key: "comisiones", label: "Comisiones", dot: activeRules.length > 0 },
    { key: "no-shows", label: "No-shows", dot: noShowCount > 0 },
    { key: "decision", label: "Decisión" },
  ];

  const providerKey = (data?.provider ?? "email").toLowerCase();
  const providerConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    google: {
      label: "Google",
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.58 1.69l3.41-3.41A12 12 0 0 0 12 0C7.38 0 3.37 2.69 1.28 6.67l3.99 3.09Z"/>
          <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.93 0-5.44-1.78-6.6-4.35l-4 3.08C3.44 21.37 7.4 24 12 24c3.27 0 6.26-1.2 8.54-3.18l-4.5-2.81Z"/>
          <path fill="#FBBC05" d="M19.1 12c0-.64-.06-1.25-.17-1.85H12v3.51h3.97a3.4 3.4 0 0 1-1.47 2.23l4.5 2.81c2.63-2.43 4.1-6 4.1-8.7Z" transform="translate(0 0)"/>
          <path fill="#4A90D9" d="M5.4 14.75a7 7 0 0 1-.4-2.25c0-.79.15-1.56.4-2.25L1.28 7.17A11.95 11.95 0 0 0 0 12c0 1.92.46 3.73 1.28 5.33l4.12-2.58Z"/>
        </svg>
      ),
    },
    facebook: {
      label: "Facebook",
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      icon: (
        <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z"/>
        </svg>
      ),
    },
    tiktok: {
      label: "TikTok",
      bg: "bg-zinc-900 border-zinc-700",
      text: "text-white",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.87a8.37 8.37 0 0 0 4.88 1.56V7a4.85 4.85 0 0 1-1.11-.31Z"/>
        </svg>
      ),
    },
    email: {
      label: "Email",
      bg: "bg-zinc-50 border-zinc-200",
      text: "text-zinc-600",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
  };
  const provider = providerConfig[providerKey] ?? providerConfig.email;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="relative flex w-full max-w-lg max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#FF6A00]/10">
              <svg className="h-3.5 w-3.5 text-[#FF6A00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Revisión de artista</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Identity strip ── */}
        {data && (
          <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={data.nombreArtistico}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6A00]/15 text-base font-bold text-[#FF6A00]">
                {data.nombreArtistico.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{data.nombreArtistico}</p>
              <p className="truncate text-xs text-zinc-400">{data.email}</p>
            </div>
            <VerifiedBadge verified={data.isVerified} />
          </div>
        )}

        {/* ── Tabs ── */}
        {data && (
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.key
                    ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t.label}
                {t.dot && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6A00]" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
            </div>
          ) : !data ? (
            <p className="p-6 text-sm text-zinc-400">No se pudo cargar el perfil.</p>
          ) : tab === "perfil" ? (
            <div className="space-y-px">

              {/* Shadow ban banner */}
              {data.shadowBannedAt && (
                <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Cuenta restringida (Shadow ban)</p>
                      {data.shadowBanReason && (
                        <p className="mt-1 text-sm text-red-700 dark:text-red-400">{data.shadowBanReason}</p>
                      )}
                      <p className="mt-1 text-xs text-red-500">
                        Desde: {new Date(data.shadowBannedAt).toLocaleDateString("es-GT")}
                      </p>
                    </div>
                    <button
                      onClick={() => shadowBanMutation.mutate({ banned: false })}
                      disabled={shadowBanMutation.isPending}
                      className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {shadowBanMutation.isPending ? "…" : "Levantar restricción"}
                    </button>
                  </div>
                </div>
              )}

              {/* Prior rejection banner */}
              {!data.isVerified && data.rejectionReason && (
                <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Rechazado anteriormente</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{data.rejectionReason}</p>
                </div>
              )}

              {/* Registration source */}
              <div className="px-5 pt-5 pb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Origen del registro</p>
                <div className={`flex items-center gap-3 rounded-xl border p-3.5 ${provider.bg}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${providerKey === 'tiktok' ? 'bg-white/10' : 'bg-white'} shadow-sm`}>
                    {provider.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${provider.text}`}>Registrado con {provider.label}</p>
                    <p className={`text-xs mt-0.5 ${providerKey === 'tiktok' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {providerKey !== 'email'
                        ? "Identidad verificada por el proveedor — el email está confirmado."
                        : data.emailVerified
                        ? "Email confirmado mediante enlace de verificación."
                        : "Email pendiente de confirmación."}
                    </p>
                  </div>
                  {(providerKey !== 'email' || data.emailVerified) && (
                    <div className="ml-auto shrink-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                        <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-5 border-t border-zinc-100 dark:border-zinc-800" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 px-5 py-4">
                {[
                  { label: "Reservas", value: data.totalBookings ?? 0, icon: "📅" },
                  { label: "Reseñas", value: data.reviewsCount ?? 0, icon: "💬" },
                  { label: "Rating", value: data.rating != null ? data.rating.toFixed(1) : "—", icon: "⭐" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-base">{s.icon}</p>
                    <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-50">{s.value}</p>
                    <p className="text-[11px] text-zinc-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="mx-5 border-t border-zinc-100 dark:border-zinc-800" />

              {/* Info rows */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Información de perfil</p>
                {[
                  { label: "Nombre artístico", value: data.nombreArtistico },
                  { label: "Email", value: data.email },
                  { label: "Categoría", value: data.categoria },
                  { label: "Ciudad", value: data.ciudad ?? "—" },
                  { label: "Estado de cuenta", value: data.isActive ? "Activa" : "Bloqueada" },
                  {
                    label: "Miembro desde",
                    value: new Date(data.createdAt).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" }),
                  },
                  {
                    label: "Último acceso",
                    value: data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleDateString("es") : "—",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-zinc-400 shrink-0">{row.label}</span>
                    <span className="text-right font-medium text-zinc-800 dark:text-zinc-200">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

          ) : tab === "documentos" ? (
            <div className="p-5 space-y-5">
              {!hasDocuments ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-7 w-7 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Sin documentos subidos</p>
                  <p className="mt-1 text-xs text-zinc-400">Este artista aún no ha subido documentos de identidad.</p>
                </div>
              ) : (
                <>
                  {/* Doc type + number */}
                  {(data.documentType || data.documentNumber) && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Tipo de documento</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {data.documentType ?? "—"}
                        {data.documentNumber && <span className="ml-2 font-normal text-zinc-500">#{data.documentNumber}</span>}
                      </p>
                    </div>
                  )}

                  {/* Document images */}
                  {[
                    { url: data.documentFrontUrl, label: "Frente del documento" },
                    { url: data.documentBackUrl, label: "Reverso del documento" },
                    { url: data.documentSelfieUrl, label: "Selfie con documento" },
                  ].filter(d => d.url).map((doc) => (
                    <div key={doc.label}>
                      <p className="mb-1.5 text-xs font-medium text-zinc-500">{doc.label}</p>
                      <a href={doc.url!} target="_blank" rel="noreferrer" className="block">
                        <img src={doc.url!} alt={doc.label}
                          className="w-full rounded-xl border border-zinc-200 object-cover shadow-sm transition hover:opacity-90 hover:shadow-md dark:border-zinc-700" />
                      </a>
                    </div>
                  ))}

                  {/* Verification checklist */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Lista de verificación</p>
                      <span className={`text-xs font-medium ${allChecked ? "text-green-600" : "text-zinc-400"}`}>
                        {Object.values(checks).filter(Boolean).length}/{Object.keys(checks).length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <CheckItem checked={checks.identity} onChange={v => setChecks(c => ({ ...c, identity: v }))}>
                        El nombre en el documento coincide con el perfil
                      </CheckItem>
                      <CheckItem checked={checks.notExpired} onChange={v => setChecks(c => ({ ...c, notExpired: v }))}>
                        El documento no está vencido
                      </CheckItem>
                      <CheckItem checked={checks.selfie} onChange={v => setChecks(c => ({ ...c, selfie: v }))}>
                        La selfie muestra claramente el rostro y el documento
                      </CheckItem>
                      <CheckItem checked={checks.readable} onChange={v => setChecks(c => ({ ...c, readable: v }))}>
                        Todos los datos son legibles y no están alterados
                      </CheckItem>
                    </div>
                    {allChecked && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/30">
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">Documentos revisados — puedes tomar una decisión</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          ) : tab === "comisiones" ? (
            /* ── Comisiones tab ── */
            <div className="p-5 space-y-5">

              {/* Active rules list */}
              {rules.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Reglas activas</p>
                  {rules.map((r) => (
                    <div key={r.id} className={`rounded-xl border p-3.5 ${r.isActive ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20" : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.type === "RATE_OVERRIDE" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                            {r.type === "RATE_OVERRIDE" ? "Tasa especial" : "Penalización"}
                          </span>
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{r.reason}</p>
                          {r.rate != null && (
                            <p className="text-xs text-zinc-500 mt-0.5">Tasa: {r.rate}%</p>
                          )}
                          {r.fixedAmount != null && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              Monto fijo: {r.currency} {(r.fixedAmount / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {r.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1.5">
                        Desde {new Date(r.startDate).toLocaleDateString("es-GT")}{r.endDate ? ` · Hasta ${new Date(r.endDate).toLocaleDateString("es-GT")}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">Sin reglas de comisión para este artista.</p>
              )}

              {/* New rule form */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Nueva regla</p>

                <div className="flex gap-2">
                  {(["RATE_OVERRIDE", "FIXED_PENALTY"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCommissionType(t)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${commissionType === t ? "border-[#FF6A00] bg-[#FF6A00]/10 text-[#FF6A00]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700"}`}
                    >
                      {t === "RATE_OVERRIDE" ? "Tasa especial" : "Penalización fija"}
                    </button>
                  ))}
                </div>

                {commissionType === "RATE_OVERRIDE" ? (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Tasa (%)</label>
                    <input
                      type="number" min="0" max="100" step="0.5"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder="Ej: 9"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Monto fijo (centavos USD)</label>
                    <input
                      type="number" min="0"
                      value={commissionFixed}
                      onChange={(e) => setCommissionFixed(e.target.value)}
                      placeholder="Ej: 1800 = $18.00"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Motivo *</label>
                  <textarea
                    rows={2}
                    value={commissionReason}
                    onChange={(e) => setCommissionReason(e.target.value)}
                    placeholder="Explica brevemente el motivo..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm resize-none focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    value={commissionStartDate}
                    onChange={(e) => setCommissionStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  />
                </div>

                <button
                  disabled={creatingCommission || !commissionReason.trim() || (!commissionRate && !commissionFixed)}
                  onClick={async () => {
                    if (!data) return;
                    setCreatingCommission(true);
                    try {
                      await commissionsApi.create({
                        artistId: data.id,
                        type: commissionType,
                        rate: commissionType === "RATE_OVERRIDE" && commissionRate ? parseFloat(commissionRate) : undefined,
                        fixedAmount: commissionType === "FIXED_PENALTY" && commissionFixed ? parseInt(commissionFixed) : undefined,
                        reason: commissionReason,
                        startDate: new Date(commissionStartDate).toISOString(),
                      });
                      setCommissionRate(""); setCommissionFixed(""); setCommissionReason("");
                      queryClient.invalidateQueries({ queryKey: ["admin-commissions", artistId] });
                    } catch { /* non-critical */ } finally {
                      setCreatingCommission(false);
                    }
                  }}
                  className="w-full rounded-xl bg-[#FF6A00] py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingCommission ? "Creando…" : "Crear regla"}
                </button>
              </div>
            </div>

          ) : tab === "no-shows" ? (
            /* ── No-shows tab ── */
            <div className="p-5 space-y-4">
              {noShowCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-7 w-7 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Sin no-shows registrados</p>
                  <p className="mt-1 text-xs text-zinc-400">Este artista no tiene disputas por no presentarse.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                      {noShowCount} {noShowCount === 1 ? "caso" : "casos"}
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Historial de no-shows</p>
                  </div>
                  <div className="space-y-3">
                    {noShowsData?.disputes.map((d) => (
                      <div key={d.id} className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 dark:border-red-900/50 dark:bg-red-950/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.subject}</p>
                            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{d.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                              <span>Reserva: <span className="font-mono">{d.bookingId.slice(0, 8)}</span></span>
                              <span>·</span>
                              <span>{new Date(d.createdAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            d.status === "RESOLVED" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : d.status === "OPEN" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                          }`}>
                            {d.status === "RESOLVED" ? "Resuelto" : d.status === "OPEN" ? "Abierto" : d.status}
                          </span>
                        </div>
                        {d.resolution && (
                          <p className="mt-2 text-[10px] text-zinc-400">
                            Resolución: <span className="font-medium text-zinc-600 dark:text-zinc-300">{d.resolution}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          ) : (
            /* ── Decisión tab ── */
            <div className="p-5 space-y-5">

              {/* Current status summary */}
              <div className={`rounded-xl border p-4 ${
                data.isVerified
                  ? "border-[#FF6A00]/30 bg-orange-50 dark:border-[#FF6A00]/40 dark:bg-[#FF6A00]/10"
                  : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
              }`}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Estado actual</p>
                <div className="flex items-center gap-2">
                  <VerifiedBadge verified={data.isVerified} />
                  <span className={`text-sm ${data.isVerified ? "text-[#FF6A00] dark:text-[#FF8A33]" : "text-amber-700 dark:text-amber-400"}`}>
                    {data.isVerified
                      ? "Este artista ya está verificado. Puedes revocar si es necesario."
                      : "Pendiente de revisión. Revisa el perfil y documentos antes de decidir."}
                  </span>
                </div>
              </div>

              {/* Admin notes */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  Notas internas
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Notas de revisión (solo visibles para el equipo admin)..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                />
              </div>

              {/* Decision cards */}
              {!data.isVerified && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Decisión</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDecision(decision === "approve" ? null : "approve")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        decision === "approve"
                          ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950/40"
                          : "border-zinc-200 bg-white hover:border-green-300 dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${decision === "approve" ? "bg-green-500" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                        <svg className={`h-4 w-4 ${decision === "approve" ? "text-white" : "text-zinc-500"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className={`text-sm font-semibold ${decision === "approve" ? "text-green-700 dark:text-green-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        Verificar
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">El perfil cumple los requisitos</p>
                    </button>
                    <button
                      onClick={() => setDecision(decision === "reject" ? null : "reject")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        decision === "reject"
                          ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/40"
                          : "border-zinc-200 bg-white hover:border-red-300 dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${decision === "reject" ? "bg-red-500" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                        <svg className={`h-4 w-4 ${decision === "reject" ? "text-white" : "text-zinc-500"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className={`text-sm font-semibold ${decision === "reject" ? "text-red-700 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        Rechazar
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">Información incompleta o inválida</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection reason — shown when reject is selected */}
              {decision === "reject" && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-red-400">
                    Motivo de rechazo <span className="normal-case font-normal text-zinc-400">(se enviará al artista)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Explica al artista qué está mal o qué debe corregir para ser verificado..."
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900 placeholder-red-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                  />
                  <p className="mt-1.5 text-xs text-zinc-400">Sé específico: menciona qué documento o dato necesita corrección.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {data && (
          <div className="border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
            {tab !== "decision" ? (
              /* From other tabs: quick action or go to decision tab */
              !data.isVerified ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDecision("approve"); setTab("decision"); }}
                    className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Verificar artista
                  </button>
                  <button
                    onClick={() => { setDecision("reject"); setTab("decision"); }}
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                  >
                    Rechazar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDecision("reject"); setTab("decision"); }}
                    className="flex-1 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Revocar verificación
                  </button>
                  {!data.shadowBannedAt ? (
                    <button
                      onClick={() => {
                        const reason = prompt("Motivo del shadow ban (opcional):") ?? "";
                        shadowBanMutation.mutate({ banned: true, reason: reason || undefined });
                      }}
                      disabled={shadowBanMutation.isPending}
                      className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 disabled:opacity-50"
                    >
                      Shadow ban
                    </button>
                  ) : (
                    <button
                      onClick={() => shadowBanMutation.mutate({ banned: false })}
                      disabled={shadowBanMutation.isPending}
                      className="rounded-xl bg-red-100 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Levantar ban
                    </button>
                  )}
                </div>
              )
            ) : (
              /* From decision tab: execute */
              data.isVerified ? (
                <button
                  onClick={() => onVerify(data.id, false, undefined, adminNotes || undefined)}
                  className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Confirmar revocación
                </button>
              ) : decision === "approve" ? (
                <button
                  onClick={() => onVerify(data.id, true, undefined, adminNotes || undefined)}
                  className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800"
                >
                  <svg className="mr-2 inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirmar verificación
                </button>
              ) : decision === "reject" ? (
                <button
                  onClick={() => onVerify(data.id, false, rejectionReason || undefined, adminNotes || undefined)}
                  disabled={!rejectionReason.trim()}
                  className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirmar rechazo
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setDecision("approve")}
                    className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Verificar artista
                  </button>
                  <button
                    onClick={() => setDecision("reject")}
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                  >
                    Rechazar
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function ArtistsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [verified, setVerified] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    artist: AdminArtistRow;
    approve: boolean;
    rejectionReason?: string;
    adminNotes?: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artists", page, verified, search, category],
    queryFn: () => artistsApi.list({ page, limit: 20, verified, search, category }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, approved, rejectionReason, adminNotes }: { id: string; approved: boolean; rejectionReason?: string; adminNotes?: string }) =>
      artistsApi.verify(id, approved, { rejectionReason, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
      queryClient.invalidateQueries({ queryKey: ["admin-artist-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setConfirmAction(null);
      setSelectedArtistId(null);
    },
  });

  const handleDrawerVerify = (id: string, approved: boolean, rejectionReason?: string, adminNotes?: string) => {
    const artist = data?.artists.find((a) => a.id === id);
    if (artist) {
      setConfirmAction({ artist, approve: approved, rejectionReason, adminNotes });
    } else {
      setConfirmAction({
        artist: { id, nombreArtistico: "este artista", isVerified: !approved } as any,
        approve: approved,
        rejectionReason,
        adminNotes,
      });
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Artistas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revisión y verificación de perfiles de artistas
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
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
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-64 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#FF6A00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button type="submit" className="rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E65F00]">
            Buscar
          </button>
        </form>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-[#FF6A00] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {ARTIST_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
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
              <div
                key={a.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer active:opacity-80"
                onClick={() => setSelectedArtistId(a.id)}
              >
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
                <p className="text-xs text-[#FF6A00]">Toca para ver perfil completo →</p>
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
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => setSelectedArtistId(a.id)}
                >
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
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
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

      {/* Artist detail drawer */}
      {selectedArtistId && (
        <ArtistDetailDrawer
          artistId={selectedArtistId}
          onClose={() => setSelectedArtistId(null)}
          onVerify={handleDrawerVerify}
          onReject={(id) => {
            const artist = data?.artists.find((a) => a.id === id);
            if (artist) setConfirmAction({ artist, approve: false });
          }}
        />
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
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
                    rejectionReason: confirmAction.rejectionReason,
                    adminNotes: confirmAction.adminNotes,
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

