"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { bookingsApi, AdminBookingDetail, BookingStatusHistory } from "@/lib/api";

const STATUS_ES: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PAYMENT_PENDING: "Pago pendiente",
  PAYMENT_COMPLETED: "Pagado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  RESCHEDULED: "Reprogramado",
  CANCELLED_CLIENT: "Cancelado (cliente)",
  CANCELLED_ARTIST: "Cancelado (artista)",
  REJECTED: "Rechazado",
  NO_SHOW: "No se presentó",
};

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  confirmado: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  completado: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  cancelado: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  disputa: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  payment_pending: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  payment_completed: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  rescheduled: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  cancelled_client: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled_artist: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

function EstadoBadge({ estado }: { estado: string }) {
  const key = estado.toLowerCase();
  const label = STATUS_ES[estado.toUpperCase()] ?? estado;
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        ESTADO_STYLES[key] ?? ESTADO_STYLES.cancelado
      }`}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="w-40 shrink-0 text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-zinc-800 dark:text-zinc-200">{value || <span className="text-zinc-400">—</span>}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function StatusTimeline({ history }: { history: BookingStatusHistory[] }) {
  if (!history || history.length === 0) {
    return <p className="py-4 text-sm text-zinc-400">Sin historial de estado.</p>;
  }

  return (
    <ol className="relative ml-3 border-l border-zinc-200 dark:border-zinc-700">
      {history.map((h, i) => {
        const label = STATUS_ES[h.status] ?? h.status;
        const key = h.status.toLowerCase();
        const dotStyle = ESTADO_STYLES[key] ?? ESTADO_STYLES.cancelado;
        return (
          <li key={h.id ?? i} className="mb-6 ml-5">
            <span
              className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 ${dotStyle.split(" ")[0]}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${dotStyle}`}>
                {label}
              </span>
              <time className="text-xs text-zinc-400">
                {new Date(h.changedAt).toLocaleString("es-GT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            {h.notes && (
              <p className="mt-1 text-xs text-zinc-500">{h.notes}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function BookingDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: booking, isLoading, isError } = useQuery<AdminBookingDetail>({
    queryKey: ["admin-booking-detail", id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Volver
        </button>
        <p className="text-sm text-red-500">No se pudo cargar la reserva.</p>
      </div>
    );
  }

  const fechaEvento = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("es-GT", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : booking.fecha
    ? new Date(booking.fecha).toLocaleDateString("es-GT", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : null;

  const monto = booking.montoDecimal != null
    ? `$${booking.montoDecimal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : booking.monto != null
    ? `$${booking.monto.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : null;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/bookings")}
        className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a reservas
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {booking.code ? (
              <span className="font-mono text-[#FF6A00]">{booking.code}</span>
            ) : (
              <span className="font-mono text-zinc-400">#{booking.id.slice(0, 8)}</span>
            )}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Creada el{" "}
            {new Date(booking.createdAt).toLocaleString("es-GT", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <EstadoBadge estado={booking.status || booking.estado} />
      </div>

      <div className="space-y-4">
        {/* Cliente */}
        <Section title="Cliente">
          <InfoRow label="Nombre" value={booking.clienteNombre} />
          <InfoRow label="Email" value={booking.clienteEmail} />
          <InfoRow label="Teléfono" value={booking.clientePhone} />
        </Section>

        {/* Artista */}
        <Section title="Artista">
          <InfoRow label="Nombre" value={booking.artistaNombre} />
          <InfoRow label="Email" value={booking.artistaEmail} />
        </Section>

        {/* Evento */}
        <Section title="Detalles del evento">
          <InfoRow label="ID de servicio" value={
            <span className="font-mono text-xs">{booking.serviceId ?? booking.servicio}</span>
          } />
          <InfoRow label="Fecha" value={fechaEvento} />
          <InfoRow label="Hora" value={booking.scheduledTime} />
          <InfoRow label="Duración" value={booking.duration ? `${booking.duration} min` : null} />
          <InfoRow label="Ubicación" value={booking.location} />
          <InfoRow label="Notas" value={booking.notes} />
        </Section>

        {/* Financiero */}
        <Section title="Información financiera">
          <InfoRow label="Monto total" value={monto ? <span className="font-semibold">{monto}</span> : null} />
          <InfoRow label="Estado de pago" value={
            booking.paymentStatus ? (
              <EstadoBadge estado={booking.paymentStatus} />
            ) : null
          } />
        </Section>

        {/* Historial de estados */}
        <Section title="Historial de estados">
          <div className="py-3">
            <StatusTimeline history={booking.statusHistory ?? []} />
          </div>
        </Section>

        {/* Meta */}
        <div className="text-xs text-zinc-400 text-right">
          ID: <span className="font-mono">{booking.id}</span>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <AdminGuard>
      <BookingDetailContent />
    </AdminGuard>
  );
}
