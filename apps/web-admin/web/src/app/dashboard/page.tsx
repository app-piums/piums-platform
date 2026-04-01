"use client";

import { useQuery } from "@tanstack/react-query";
import { statsApi, type AdminStats } from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  accentColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 border-t-2 ${accentColor ?? "border-t-zinc-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function BookingChart({ data }: { data: AdminStats["bookingsByMonth"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Reservas por mes
      </h3>
      <div className="flex h-40 items-end gap-3">
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-zinc-500">{d.count}</span>
            <div
              className="w-full rounded-t-md bg-[#FF6A00]/80 transition-all"
              style={{ height: `${(d.count / max) * 120}px` }}
            />
            <span className="text-xs text-zinc-400">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: statsApi.get,
    refetchInterval: 60_000,
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Resumen general de la plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios totales"
          value={stats.totalUsers.toLocaleString()}
          sub={`+${stats.recentUsers} esta semana`}
          color="bg-blue-50 dark:bg-blue-950"
          accentColor="border-t-blue-400"
          icon={
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Artistas"
          value={stats.totalArtists.toLocaleString()}
          color="bg-purple-50 dark:bg-purple-950"
          accentColor="border-t-purple-400"
          icon={
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
        />
        <StatCard
          label="Reservas totales"
          value={stats.totalBookings.toLocaleString()}
          sub={`${stats.bookingsThisMonth} este mes`}
          color="bg-orange-50 dark:bg-orange-950"
          accentColor="border-t-orange-400"
          icon={
            <svg className="h-5 w-5 text-[#FF6A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Ingresos totales"
          value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={`$${stats.revenueThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })} este mes`}
          color="bg-green-50 dark:bg-green-950"
          accentColor="border-t-green-400"
          icon={
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Chart + pending reports */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BookingChart data={stats.bookingsByMonth} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Reportes pendientes
          </h3>
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <span
              className={`text-4xl font-bold ${
                stats.pendingReports > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              {stats.pendingReports}
            </span>
            <p className="text-sm text-zinc-500">
              {stats.pendingReports === 0
                ? "Sin reportes pendientes"
                : stats.pendingReports === 1
                ? "reporte por resolver"
                : "reportes por resolver"}
            </p>
            {stats.pendingReports > 0 && (
              <a
                href="/reports"
                className="mt-2 rounded-lg bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
              >
                Revisar reportes →
              </a>
            )}
          </div>
        </div>
      </div>
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
