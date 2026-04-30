'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, type WeeklyAvailabilityRule } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

const DAYS: { key: WeeklyAvailabilityRule['dayOfWeek']; label: string; short: string }[] = [
  { key: 'LUNES',     label: 'Lunes',     short: 'L'  },
  { key: 'MARTES',    label: 'Martes',    short: 'Ma' },
  { key: 'MIERCOLES', label: 'Miércoles', short: 'Mi' },
  { key: 'JUEVES',    label: 'Jueves',    short: 'J'  },
  { key: 'VIERNES',   label: 'Viernes',   short: 'V'  },
  { key: 'SABADO',    label: 'Sábado',    short: 'S'  },
  { key: 'DOMINGO',   label: 'Domingo',   short: 'D'  },
];

type DayState = {
  enabled: boolean;
  slots: { startTime: string; endTime: string }[];
};

type Schedule = Record<WeeklyAvailabilityRule['dayOfWeek'], DayState>;

const DEFAULT_SLOT = { startTime: '09:00', endTime: '18:00' };

function buildDefaultSchedule(): Schedule {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, { enabled: false, slots: [{ ...DEFAULT_SLOT }] }])
  ) as Schedule;
}

function rulesFromSchedule(schedule: Schedule): WeeklyAvailabilityRule[] {
  const rules: WeeklyAvailabilityRule[] = [];
  for (const { key } of DAYS) {
    const day = schedule[key];
    if (day.enabled) {
      for (const slot of day.slots) {
        rules.push({ dayOfWeek: key, startTime: slot.startTime, endTime: slot.endTime });
      }
    }
  }
  return rules;
}

function scheduleFromRules(rules: WeeklyAvailabilityRule[]): Schedule {
  const schedule = buildDefaultSchedule();
  for (const rule of rules) {
    const day = schedule[rule.dayOfWeek];
    if (!day.enabled) {
      day.enabled = true;
      day.slots = [{ startTime: rule.startTime, endTime: rule.endTime }];
    } else {
      day.slots.push({ startTime: rule.startTime, endTime: rule.endTime });
    }
  }
  return schedule;
}

export default function DisponibilidadPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [schedule, setSchedule] = useState<Schedule>(buildDefaultSchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    sdk.getMyWeeklyAvailability()
      .then(({ availability }) => {
        if (availability?.length) setSchedule(scheduleFromRules(availability));
      })
      .catch(() => setFetchError('No se pudo cargar tu disponibilidad.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toggleDay = (day: WeeklyAvailabilityRule['dayOfWeek']) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: prev[day].slots.length ? prev[day].slots : [{ ...DEFAULT_SLOT }],
      },
    }));
  };

  const updateSlot = (
    day: WeeklyAvailabilityRule['dayOfWeek'],
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSchedule((prev) => {
      const slots = prev[day].slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const addSlot = (day: WeeklyAvailabilityRule['dayOfWeek']) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { ...DEFAULT_SLOT }] },
    }));
  };

  const removeSlot = (day: WeeklyAvailabilityRule['dayOfWeek'], index: number) => {
    setSchedule((prev) => {
      const slots = prev[day].slots.filter((_, i) => i !== index);
      return { ...prev, [day]: { ...prev[day], slots: slots.length ? slots : [{ ...DEFAULT_SLOT }] } };
    });
  };

  const handleSave = async () => {
    const rules = rulesFromSchedule(schedule);
    for (const r of rules) {
      if (r.startTime >= r.endTime) {
        toast.error(`${DAYS.find((d) => d.key === r.dayOfWeek)?.label}: la hora de inicio debe ser antes de la hora de fin.`);
        return;
      }
    }
    setSaving(true);
    try {
      await sdk.setMyWeeklyAvailability(rules);
      toast.success('Disponibilidad actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = DAYS.filter(({ key }) => schedule[key].enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-72 p-6 pt-20 lg:pt-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Horarios semanales</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configura en qué días y horarios estás disponible para recibir reservas. Los clientes solo podrán agendar en estos rangos.
            </p>
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">{fetchError}</div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Cargando horarios…</div>
          ) : (
            <>
              {/* Quick summary */}
              <div className="flex gap-1.5 mb-6 flex-wrap">
                {DAYS.map(({ key, short }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                      schedule[key].enabled
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-400 hover:border-orange-300'
                    }`}
                  >
                    {short}
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-400 self-center">
                  {enabledCount === 0 ? 'Ningún día activo' : `${enabledCount} día${enabledCount > 1 ? 's' : ''} activo${enabledCount > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Day cards */}
              <div className="space-y-3">
                {DAYS.map(({ key, label }) => {
                  const day = schedule[key];
                  return (
                    <div
                      key={key}
                      className={`bg-white rounded-xl border transition-colors ${
                        day.enabled ? 'border-orange-200 shadow-sm' : 'border-gray-100'
                      }`}
                    >
                      {/* Day header */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleDay(key)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                              day.enabled ? 'bg-orange-500' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                day.enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-sm font-semibold ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                            {label}
                          </span>
                        </div>
                        {day.enabled && (
                          <button
                            onClick={() => addSlot(key)}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            + Horario
                          </button>
                        )}
                      </div>

                      {/* Slots */}
                      {day.enabled && (
                        <div className="px-4 pb-4 space-y-2">
                          {day.slots.map((slot, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSlot(key, i, 'startTime', e.target.value)}
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                              <span className="text-gray-400 text-sm">–</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSlot(key, i, 'endTime', e.target.value)}
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                              {day.slots.length > 1 && (
                                <button
                                  onClick={() => removeSlot(key, i)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Info box */}
              <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Los horarios configurados aquí son recurrentes cada semana. Para bloquear fechas específicas usa la sección de <strong>Ausencias / Viajes</strong>.
                </span>
              </div>

              {/* Save */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
                >
                  {saving ? 'Guardando…' : 'Guardar disponibilidad'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
