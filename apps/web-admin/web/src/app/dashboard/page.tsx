"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { statsApi, analyticsApi, type AdminStats, type BookingFunnelData } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";
import { ThemeToggle } from "@/contexts/ThemeContext";

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIODS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon, accentColor,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 border-t-2 ${accentColor ?? "border-t-zinc-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Booking chart ────────────────────────────────────────────────────────────

function BarChart({
  data, color, valueKey, labelKey, formatValue,
}: {
  data: Record<string, any>[];
  color: string;
  valueKey: string;
  labelKey: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="flex h-40 items-end gap-2 sm:gap-3">
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-medium text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
          </span>
          <div
            className={`w-full rounded-t-md transition-all ${color}`}
            style={{ height: `${Math.max((d[valueKey] / max) * 120, d[valueKey] > 0 ? 4 : 0)}px` }}
          />
          <span className="text-[10px] text-zinc-400">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Horizontal bar (category distribution) ──────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  MUSICO: "Músico", FOTOGRAFO: "Fotógrafo", TATUADOR: "Tatuador",
  MAQUILLADOR: "Maquillador", DJ: "DJ", PINTOR: "Pintor",
  BAILARIN: "Bailarín", VIDEOGRAFO: "Videógrafo", DISENADOR: "Diseñador",
  ANIMADOR: "Animador", MAGO: "Mago", ACROBATA: "Acróbata", OTRO: "Otro",
};

function CategoryChart({ data }: { data: AdminStats["artistsByCategory"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((d) => (
        <div key={d.category} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-zinc-500 text-right">
            {CATEGORY_LABELS[d.category] ?? d.category}
          </span>
          <div className="flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-400 dark:bg-purple-500 transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

function ConversionFunnel({ data }: { data: AdminStats["conversionFunnel"] }) {
  const registrado = data.totalUsers;
  const artistas = data.totalArtists;
  const verificados = data.verifiedArtists;
  const pctArtistas = registrado > 0 ? ((artistas / registrado) * 100).toFixed(1) : "0";
  const pctVerif = artistas > 0 ? ((verificados / artistas) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-2">
      {[
        { label: "Usuarios registrados", value: registrado, pct: null, color: "bg-blue-400" },
        { label: "Artistas", value: artistas, pct: `${pctArtistas}%`, color: "bg-purple-400" },
        { label: "Artistas verificados", value: verificados, pct: `${pctVerif}%`, color: "bg-[#FF6A00]" },
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`h-2.5 rounded-full ${step.color}`}
            style={{ width: `${Math.max((step.value / Math.max(registrado, 1)) * 100, step.value > 0 ? 8 : 0)}%`, maxWidth: "100%", transition: "width 0.4s" }}
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
            {step.label}: <strong className="text-zinc-900 dark:text-zinc-50">{step.value.toLocaleString()}</strong>
            {step.pct && <span className="ml-1 text-zinc-400">({step.pct})</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Top artists ──────────────────────────────────────────────────────────────

function TopArtists({ data }: { data: AdminStats["topArtists"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-400">Sin datos de reservas aún.</p>;
  }
  const maxBookings = Math.max(...data.map((a) => a.bookings), 1);
  return (
    <div className="space-y-3">
      {data.map((a, i) => (
        <div key={a.artistId} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-zinc-400">#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{a.nombre}</p>
            <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF6A00]/80"
                style={{ width: `${(a.bookings / maxBookings) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{a.bookings}</p>
            <p className="text-xs text-zinc-400">${a.revenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Booking Funnel ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  service: "Servicio",
  datetime: "Fecha/Hora",
  details: "Detalles",
  review: "Revisión",
  checkout: "Pago",
  confirmed: "Confirmado",
};

const FUNNEL_COLORS = [
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F97316", // orange
  "#FF6A00", // brand orange
];

function BookingFunnel({ data }: { data: BookingFunnelData }) {
  const maxEntered = Math.max(...data.steps.map((s) => s.entered), 1);

  return (
    <div className="space-y-3">
      {data.steps.map((step, i) => {
        const color = FUNNEL_COLORS[Math.min(i, FUNNEL_COLORS.length - 1)];
        const widthPct = Math.max((step.entered / maxEntered) * 100, step.entered > 0 ? 4 : 0);
        return (
          <div key={step.step} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-zinc-500 dark:text-zinc-400 text-right">
              {STEP_LABELS[step.step] ?? step.step}
            </span>
            <div className="flex-1 relative h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${widthPct}%`, backgroundColor: color, opacity: 0.85 }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-white mix-blend-luminosity">
                {step.entered.toLocaleString()} entradas · {step.completed.toLocaleString()} completadas
              </span>
            </div>
            <span
              className="w-14 shrink-0 text-right text-xs font-semibold rounded-full px-2 py-0.5"
              style={{ backgroundColor: color + "22", color }}
            >
              {step.conversionRate.toFixed(1)}%
            </span>
          </div>
        );
      })}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-200 dark:border-zinc-700 pt-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Sesiones totales: <strong className="text-zinc-900 dark:text-zinc-50">{data.totalSessions.toLocaleString()}</strong></span>
        <span>Completadas: <strong className="text-zinc-900 dark:text-zinc-50">{data.totalCompleted.toLocaleString()}</strong></span>
        <span>Tasa global: <strong className="text-[#FF6A00]">{data.overallConversionRate.toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}

// ─── Dashboard content ────────────────────────────────────────────────────────

function DashboardContent() {
  const [period, setPeriod] = useState("6m");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-stats", period],
    queryFn: () => statsApi.get(period),
    refetchInterval: 60_000,
  });

  const { data: funnelData } = useQuery({
    queryKey: ["admin-booking-funnel"],
    queryFn: () => analyticsApi.getFunnel(30),
    refetchInterval: 120_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="m-8 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        Error al cargar estadísticas. Intenta de nuevo.
      </div>
    );
  }

  const stats = data;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Resumen general de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios totales"
          value={stats.totalUsers.toLocaleString()}
          sub={`+${stats.recentUsers} esta semana`}
          color="bg-blue-50 dark:bg-blue-950"
          accentColor="border-t-blue-400"
          icon={<svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Artistas"
          value={stats.totalArtists.toLocaleString()}
          sub={`${stats.conversionFunnel.verifiedArtists} verificados`}
          color="bg-purple-50 dark:bg-purple-950"
          accentColor="border-t-purple-400"
          icon={<svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
        />
        <StatCard
          label="Reservas totales"
          value={stats.totalBookings.toLocaleString()}
          sub={`${stats.bookingsThisMonth} este mes`}
          color="bg-orange-50 dark:bg-orange-950"
          accentColor="border-t-orange-400"
          icon={<svg className="h-5 w-5 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Ingresos totales"
          value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={`$${stats.revenueThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })} este mes`}
          color="bg-green-50 dark:bg-green-950"
          accentColor="border-t-green-400"
          icon={<svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Row 1: Bookings chart + Revenue chart */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reservas por mes</h3>
          <BarChart
            data={stats.bookingsByMonth}
            color="bg-[#FF6A00]/80 hover:bg-[#FF6A00]"
            valueKey="count"
            labelKey="month"
          />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ingresos por mes ($)</h3>
          <BarChart
            data={stats.revenueByMonth}
            color="bg-green-400/80 hover:bg-green-500"
            valueKey="amount"
            labelKey="month"
            formatValue={(v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
          />
        </div>
      </div>

      {/* Row 2: Users by month + Pending reports */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nuevos usuarios por mes</h3>
          <BarChart
            data={stats.usersByMonth}
            color="bg-blue-400/80 hover:bg-blue-500"
            valueKey="count"
            labelKey="month"
          />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reportes pendientes</h3>
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <span className={`text-4xl font-bold ${stats.pendingReports > 0 ? "text-red-500" : "text-green-500"}`}>
              {stats.pendingReports}
            </span>
            <p className="text-sm text-zinc-500">
              {stats.pendingReports === 0 ? "Sin reportes pendientes"
                : stats.pendingReports === 1 ? "reporte por resolver"
                : "reportes por resolver"}
            </p>
            {stats.pendingReports > 0 && (
              <Link href="/reports"
                className="mt-2 rounded-lg bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400">
                Revisar →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Category distribution + Top artists + Conversion funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Artistas por categoría</h3>
          {stats.artistsByCategory.length > 0 ? (
            <CategoryChart data={stats.artistsByCategory} />
          ) : (
            <p className="text-sm text-zinc-400">Sin datos de categorías aún.</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Top artistas por reservas
            <span className="ml-1.5 text-xs font-normal text-zinc-400">(período)</span>
          </h3>
          <TopArtists data={stats.topArtists} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Embudo de conversión</h3>
          <ConversionFunnel data={stats.conversionFunnel} />
        </div>
      </div>

      {/* Row 4: Booking funnel */}
      {funnelData && (
        <div className="mt-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Embudo de Reserva{" "}
              <span className="ml-1.5 text-xs font-normal text-zinc-400">(30 días)</span>
            </h3>
            <BookingFunnel data={funnelData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

