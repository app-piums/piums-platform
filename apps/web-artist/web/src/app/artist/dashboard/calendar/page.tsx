'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, BlockedSlot, Booking } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';

type DayStatus = 'available' | 'blocked' | 'occupied' | 'partial';

interface HoursConfig {
  start: string;
  end: string;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayStartISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString();
}

function dayEndISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
}

export default function ArtistCalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Hours config modal
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursConfig, setHoursConfig] = useState<HoursConfig>({ start: '09:00', end: '18:00' });

  const loadMonthData = useCallback(async (aid: string, month: Date) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    try {
      const [slots, bookingsData] = await Promise.all([
        sdk.getBlockedSlots(aid, start.toISOString(), end.toISOString()),
        sdk.getArtistBookings({ limit: 100 }),
      ]);
      setBlockedSlots(slots);
      setBookings(bookingsData.bookings ?? []);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    sdk.getArtistProfile()
      .then((profile) => {
        setArtistId(profile.id);
        return loadMonthData(profile.id, currentMonth);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) router.push('/login');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    loadMonthData(artistId, currentMonth).finally(() => setLoading(false));
  }, [currentMonth, artistId, loadMonthData]);

  const getDaysInMonth = (date: Date) => {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days: Date[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };

  const getFirstDayOfWeek = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDayStatus = (date: Date): DayStatus => {
    const dateStr = toLocalDateStr(date);
    const isBlocked = blockedSlots.some((s) => {
      const slotDate = toLocalDateStr(new Date(s.startTime));
      return slotDate === dateStr;
    });
    const hasBooking = bookings.some((b) => {
      const bookingDate = toLocalDateStr(new Date(b.scheduledDate));
      return bookingDate === dateStr && (b.status === 'CONFIRMED' || b.status === 'PENDING');
    });
    if (isBlocked && hasBooking) return 'partial';
    if (isBlocked) return 'blocked';
    if (hasBooking) return 'occupied';
    return 'available';
  };

  const getSlotsForDate = (date: Date): BlockedSlot[] => {
    const dateStr = toLocalDateStr(date);
    return blockedSlots.filter((s) => toLocalDateStr(new Date(s.startTime)) === dateStr);
  };

  const showFeedback = (msg: string, isError = false) => {
    if (isError) { setActionError(msg); setTimeout(() => setActionError(null), 4000); }
    else { setActionSuccess(msg); setTimeout(() => setActionSuccess(null), 4000); }
  };

  const handleBlockDay = async () => {
    if (!artistId || !selectedDate) return;
    setSaving(true);
    try {
      await sdk.blockSlot({
        artistId,
        startTime: dayStartISO(selectedDate),
        endTime: dayEndISO(selectedDate),
        reason: 'Día bloqueado',
      });
      await loadMonthData(artistId, currentMonth);
      showFeedback('Día bloqueado correctamente');
    } catch (err) {
      showFeedback(getErrorMessage(err) || 'Error al bloquear el día', true);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAvailable = async () => {
    if (!artistId || !selectedDate) return;
    const slotsToRemove = getSlotsForDate(selectedDate);
    if (slotsToRemove.length === 0) {
      showFeedback('Este día ya está disponible');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(slotsToRemove.map((s) => sdk.unblockSlot(s.id)));
      await loadMonthData(artistId, currentMonth);
      showFeedback('Día marcado como disponible');
    } catch (err) {
      showFeedback(getErrorMessage(err) || 'Error al desbloquear el día', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    if (!artistId || !selectedDate) return;
    setSaving(true);
    try {
      // Remove any existing blocks for this day
      const existing = getSlotsForDate(selectedDate);
      await Promise.all(existing.map((s) => sdk.unblockSlot(s.id)));

      // Block before start time (00:00 → start)
      const [startH, startM] = hoursConfig.start.split(':').map(Number);
      const [endH, endM] = hoursConfig.end.split(':').map(Number);
      const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const workStart = new Date(dayStart.getTime());
      workStart.setHours(startH, startM, 0, 0);
      const workEnd = new Date(dayStart.getTime());
      workEnd.setHours(endH, endM, 0, 0);
      const dayEnd = new Date(dayStart.getTime());
      dayEnd.setHours(23, 59, 59, 0);

      const blocks: Promise<BlockedSlot>[] = [];
      if (workStart > dayStart) {
        blocks.push(sdk.blockSlot({ artistId, startTime: dayStart.toISOString(), endTime: workStart.toISOString(), reason: 'Fuera de horario' }));
      }
      if (workEnd < dayEnd) {
        blocks.push(sdk.blockSlot({ artistId, startTime: workEnd.toISOString(), endTime: dayEnd.toISOString(), reason: 'Fuera de horario' }));
      }
      await Promise.all(blocks);
      await loadMonthData(artistId, currentMonth);
      setShowHoursModal(false);
      showFeedback(`Horario configurado: ${hoursConfig.start} – ${hoursConfig.end}`);
    } catch (err) {
      showFeedback(getErrorMessage(err) || 'Error al configurar horario', true);
    } finally {
      setSaving(false);
    }
  };

  const monthName = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const firstDow = getFirstDayOfWeek(currentMonth);

  const dayStatusColors: Record<DayStatus, string> = {
    available: '',
    blocked: 'bg-red-100 text-red-700 border border-red-300',
    occupied: 'bg-blue-100 text-blue-700 border border-blue-300',
    partial: 'bg-orange-100 text-orange-700 border border-orange-300',
  };

  if (loading && !artistId) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando calendario...</div>
        </main>
      </div>
    );
  }

  const selectedDayStatus = selectedDate ? getDayStatus(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />

      <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Calendario</h1>
            <p className="text-gray-500 text-sm">Administra tu disponibilidad y bloquea fechas</p>
          </div>

          {/* Feedback banners */}
          {actionSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✓ {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              ✗ {actionError}
            </div>
          )}

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="hidden sm:inline">← Anterior</span>
                <span className="sm:hidden">←</span>
              </button>
              <h2 className="text-base sm:text-xl font-bold text-gray-900 capitalize flex items-center gap-2">
                {monthName}
                {loading && <span className="text-xs text-gray-400 font-normal">(cargando...)</span>}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="hidden sm:inline">Siguiente →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Bloqueado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Con reserva</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Bloqueado + reserva</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Hoy</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers */}
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => (
                <div key={i} className="text-center font-medium text-gray-500 text-xs py-2">
                  <span className="sm:hidden">{day}</span>
                  <span className="hidden sm:inline">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i]}</span>
                </div>
              ))}

              {/* Empty cells offset */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Days */}
              {days.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const status = getDayStatus(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      aspect-square p-1 rounded-lg text-center transition-colors text-sm font-medium
                      ${isSelected ? 'ring-2 ring-purple-600' : ''}
                      ${isToday && !isSelected ? 'bg-purple-100 text-purple-700 font-bold' : ''}
                      ${status !== 'available' ? dayStatusColors[status] : ''}
                      ${status === 'available' && !isToday ? 'hover:bg-gray-100 text-gray-900' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Actions */}
          {selectedDate && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                  {selectedDate.toLocaleDateString('es-GT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                {selectedDayStatus && selectedDayStatus !== 'available' && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selectedDayStatus === 'blocked' ? 'bg-red-100 text-red-700' :
                    selectedDayStatus === 'occupied' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedDayStatus === 'blocked' ? 'Bloqueado' :
                     selectedDayStatus === 'occupied' ? 'Con reservas' : 'Bloqueado + reservas'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBlockDay}
                  disabled={saving || selectedDayStatus === 'blocked'}
                  className="flex-1 min-w-[130px] px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '...' : '🚫 Bloquear día'}
                </button>
                <button
                  onClick={handleMarkAvailable}
                  disabled={saving || selectedDayStatus === 'available'}
                  className="flex-1 min-w-[130px] px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '...' : '✓ Marcar disponible'}
                </button>
                <button
                  onClick={() => setShowHoursModal(true)}
                  disabled={saving}
                  className="flex-1 min-w-[130px] px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏰ Configurar horarios
                </button>
              </div>

              {/* Bookings for selected day */}
              {(() => {
                const dayStr = toLocalDateStr(selectedDate);
                const dayBookings = bookings.filter(
                  (b) =>
                    toLocalDateStr(new Date(b.scheduledDate)) === dayStr &&
                    (b.status === 'CONFIRMED' || b.status === 'PENDING')
                );
                if (dayBookings.length === 0) return null;
                return (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Reservas este día:</p>
                    <ul className="space-y-2">
                      {dayBookings.map((b) => (
                        <li key={b.id} className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg flex justify-between">
                          <span>{new Date(b.scheduledDate).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={`text-xs font-medium ${b.status === 'CONFIRMED' ? 'text-green-700' : 'text-yellow-700'}`}>
                            {b.status === 'CONFIRMED' ? 'Confirmada' : 'Pendiente'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* Hours Config Modal */}
      {showHoursModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Configurar horarios</h3>
            <p className="text-sm text-gray-500 mb-5 capitalize">
              {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
                <input
                  type="time"
                  value={hoursConfig.start}
                  onChange={(e) => setHoursConfig((h) => ({ ...h, start: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de fin</label>
                <input
                  type="time"
                  value={hoursConfig.end}
                  onChange={(e) => setHoursConfig((h) => ({ ...h, end: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Se bloquearán las horas fuera de este rango. El horario {hoursConfig.start}–{hoursConfig.end} quedará disponible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHoursModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHours}
                disabled={saving || hoursConfig.start >= hoursConfig.end}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar horario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
