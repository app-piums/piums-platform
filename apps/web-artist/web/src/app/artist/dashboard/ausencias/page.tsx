'use client';

import React, { useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, TravelAbsence, CreateAbsencePayload } from '@piums/sdk';
import { getErrorMessage, isUnauthorizedError } from '@/lib/errors';
import { Palmtree, Plane } from 'lucide-react';

const COUNTRY_OPTIONS = [
  { code: 'AR', label: 'Argentina' },
  { code: 'BO', label: 'Bolivia' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CR', label: 'Costa Rica' },
  { code: 'CU', label: 'Cuba' },
  { code: 'DO', label: 'República Dominicana' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'SV', label: 'El Salvador' },
  { code: 'ES', label: 'España' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'GT', label: 'Guatemala' },
  { code: 'HN', label: 'Honduras' },
  { code: 'MX', label: 'México' },
  { code: 'NI', label: 'Nicaragua' },
  { code: 'PA', label: 'Panamá' },
  { code: 'PY', label: 'Paraguay' },
  { code: 'PE', label: 'Perú' },
  { code: 'PR', label: 'Puerto Rico' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'VE', label: 'Venezuela' },
];

function formatDateRange(startAt: string, endAt: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(startAt)} — ${fmt(endAt)}`;
}

function countryLabel(code: string): string {
  return COUNTRY_OPTIONS.find((c) => c.code === code)?.label ?? code;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AusenciasPage() {
  const router = useRouter();

  const [absences, setAbsences] = useState<TravelAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formType, setFormType] = useState<'VACATION' | 'WORKING_ABROAD'>('VACATION');
  const [formDest, setFormDest] = useState('MX');
  const [formReason, setFormReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    sdk
      .getAbsences()
      .then((data) => setAbsences(data))
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          router.replace('/artist/login');
        } else {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formStartAt || !formEndAt) {
      setFormError('Las fechas de inicio y fin son obligatorias.');
      return;
    }
    if (new Date(formEndAt) <= new Date(formStartAt)) {
      setFormError('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }
    if (formType === 'WORKING_ABROAD' && !formDest) {
      setFormError('Selecciona el país destino.');
      return;
    }

    const payload: CreateAbsencePayload = {
      startAt: new Date(formStartAt).toISOString(),
      endAt: new Date(formEndAt + 'T23:59:59').toISOString(),
      type: formType,
      ...(formType === 'WORKING_ABROAD' && { destinationCountry: formDest }),
      ...(formReason.trim() && { reason: formReason.trim() }),
    };

    setFormSaving(true);
    try {
      const created = await sdk.createAbsence(payload);
      setAbsences((prev) => [created, ...prev]);
      setShowForm(false);
      setFormStartAt('');
      setFormEndAt('');
      setFormType('VACATION');
      setFormDest('MX');
      setFormReason('');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(absenceId: string) {
    setDeleteError(null);
    try {
      await sdk.deleteAbsence(absenceId);
      setAbsences((prev) => prev.filter((a) => a.id !== absenceId));
      setDeletingId(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
        <PageHelpButton tourId="artistAusenciasTour" />

      <main className="flex-1 lg:ml-72 p-6 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ausencias y Viajes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Registra tus períodos de ausencia para que el sistema gestione tu
              visibilidad automáticamente.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Nueva ausencia
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <Palmtree size={20} className="text-orange-400 shrink-0 mt-0.5" />
            <span>
              <strong>Vacaciones</strong> — No apareces en ninguna búsqueda mientras estás ausente.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Plane size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Trabajando en el extranjero</strong> — Solo te ven los clientes del país
              destino; eres invisible en tu país de origen.
            </span>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Nueva ausencia</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Fecha de inicio</span>
                  <input
                    type="date"
                    min={today()}
                    value={formStartAt}
                    onChange={(e) => setFormStartAt(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Fecha de fin</span>
                  <input
                    type="date"
                    min={formStartAt || today()}
                    value={formEndAt}
                    onChange={(e) => setFormEndAt(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </label>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700 block mb-2">Tipo</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType('VACATION')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formType === 'VACATION'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Palmtree size={15} /> Vacaciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('WORKING_ABROAD')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formType === 'WORKING_ABROAD'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Plane size={15} /> Trabajando en el extranjero
                  </button>
                </div>
              </div>

              {formType === 'WORKING_ABROAD' && (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">País destino</span>
                    <select
                      value={formDest}
                      onChange={(e) => setFormDest(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Durante esta ausencia, <strong>solo serás visible para clientes en {countryLabel(formDest)}</strong>. Los clientes en tu país de origen no podrán encontrarte en búsquedas hasta que finalice la ausencia.
                    </span>
                  </div>
                </>
              )}

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Motivo <span className="text-gray-400">(opcional)</span>
                </span>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="Ej. Festival Internacional de Jazz"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={formSaving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {formSaving ? 'Guardando…' : 'Guardar ausencia'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError(null);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Absence list */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-sm">Cargando ausencias…</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>
        ) : absences.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
            <Plane size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No tienes ausencias registradas.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {absences.map((absence) => (
              <li
                key={absence.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 shrink-0">
                    {absence.type === 'VACATION' ? <Palmtree size={20} className="text-orange-400" /> : <Plane size={20} className="text-blue-400" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {absence.type === 'VACATION'
                        ? 'Vacaciones'
                        : `Trabajando en ${countryLabel(absence.destinationCountry ?? '')}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDateRange(absence.startAt, absence.endAt)}
                    </p>
                    {absence.reason && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{absence.reason}</p>
                    )}
                  </div>
                </div>

                {/* Delete */}
                {deletingId === absence.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">¿Eliminar?</span>
                    <button
                      onClick={() => handleDelete(absence.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => { setDeletingId(null); setDeleteError(null); }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(absence.id)}
                    className="text-xs font-medium text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {deleteError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
        )}
      </main>
    </div>
  );
}
