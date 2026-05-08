'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGuard } from '@/components/AdminGuard';
import { couponsApi, type AdminCoupon } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  PAUSED: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  EXPIRED: { label: 'Expirado', className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Porcentaje',
  FIXED_AMOUNT: 'Monto fijo',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  GLOBAL: 'Global',
  ARTIST: 'Artista',
  CLIENT: 'Cliente',
  SERVICE: 'Servicio',
};

function formatDiscount(coupon: AdminCoupon) {
  if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}%`;
  return `$${coupon.discountValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Empty coupon form ────────────────────────────────────────────────────────

const emptyForm = (): Partial<AdminCoupon> => ({
  code: undefined,
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  maxUses: undefined,
  maxUsesPerUser: 1,
  maxDiscountAmount: undefined,
  targetType: 'GLOBAL',
  targetId: '',
  minimumAmount: undefined,
  status: 'ACTIVE',
  startsAt: new Date().toISOString().split('T')[0],
  expiresAt: '',
});

// ─── CouponModal ──────────────────────────────────────────────────────────────

function CouponModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: Partial<AdminCoupon>;
  onClose: () => void;
  onSave: (data: Partial<AdminCoupon>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<AdminCoupon>>(initial);

  const set = (key: keyof AdminCoupon, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const inputClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';
  const labelClass = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1';
  const selectClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {initial.id ? 'Editar Cupón' : 'Nuevo Cupón'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                required
                className={inputClass}
                value={form.name || ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="ej: Descuento verano"
              />
            </div>
            <div>
              <label className={labelClass}>Código</label>
              {initial.id ? (
                <input
                  className={inputClass}
                  value={form.code || ''}
                  readOnly
                />
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 px-3 py-2">
                  <span className="inline-flex items-center rounded-full bg-[#FF6A00]/10 px-2 py-0.5 text-xs font-semibold text-[#FF6A00]">AUTO</span>
                  <span className="text-xs text-zinc-400">Se asignará al guardar (CUP-00001…)</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <input
              className={inputClass}
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción breve del cupón"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de descuento</label>
              <select className={selectClass} value={form.discountType} onChange={(e) => set('discountType', e.target.value)}>
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED_AMOUNT">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Valor *</label>
              <input
                required
                type="number"
                min={0}
                step={form.discountType === 'PERCENTAGE' ? 1 : 0.01}
                className={inputClass}
                value={form.discountValue ?? ''}
                onChange={(e) => set('discountValue', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Usos máximos (total)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.maxUses ?? ''}
                onChange={(e) => set('maxUses', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Sin límite"
              />
            </div>
            <div>
              <label className={labelClass}>Usos por usuario</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.maxUsesPerUser ?? 1}
                onChange={(e) => set('maxUsesPerUser', parseInt(e.target.value))}
              />
            </div>
          </div>

          {form.discountType === 'PERCENTAGE' && (
            <div>
              <label className={labelClass}>Descuento máximo ($) <span className="text-zinc-400 font-normal">— opcional, evita descuentos desproporcionados</span></label>
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                value={form.maxDiscountAmount !== undefined ? (form.maxDiscountAmount / 100).toFixed(2) : ''}
                onChange={(e) => set('maxDiscountAmount', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined)}
                placeholder="Sin límite de descuento"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Target</label>
              <select className={selectClass} value={form.targetType} onChange={(e) => set('targetType', e.target.value)}>
                <option value="GLOBAL">Global</option>
                <option value="ARTIST">Artista</option>
                <option value="CLIENT">Cliente</option>
                <option value="SERVICE">Servicio</option>
              </select>
            </div>
            {form.targetType !== 'GLOBAL' && (
              <div>
                <label className={labelClass}>ID del target</label>
                <input
                  className={inputClass}
                  value={form.targetId || ''}
                  onChange={(e) => set('targetId', e.target.value)}
                  placeholder="ID del artista/cliente/servicio"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Monto mínimo ($)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.minimumAmount ?? ''}
                onChange={(e) => set('minimumAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Sin mínimo"
              />
            </div>
            <div>
              <label className={labelClass}>Válido desde *</label>
              <input
                required
                type="date"
                className={inputClass}
                value={form.startsAt?.split('T')[0] || ''}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Válido hasta</label>
              <input
                type="date"
                className={inputClass}
                value={form.expiresAt?.split('T')[0] || ''}
                onChange={(e) => set('expiresAt', e.target.value || undefined)}
              />
            </div>
          </div>

          {initial.id && (
            <div>
              <label className={labelClass}>Estado</label>
              <select className={selectClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="ACTIVE">Activo</option>
                <option value="PAUSED">Pausado</option>
                <option value="EXPIRED">Expirado</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Guardando...' : initial.id ? 'Guardar cambios' : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── BulkGenerateModal ────────────────────────────────────────────────────────

function BulkGenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [prefix, setPrefix] = useState('PIUMS');
  const [count, setCount] = useState(10);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(15);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; coupons: { code: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';
  const labelClass = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await couponsApi.bulkGenerate({
        prefix,
        count,
        template: {
          name: `Cupón ${prefix}`,
          discountType,
          discountValue: discountType === 'PERCENTAGE' ? discountValue : Math.round(discountValue * 100),
          maxDiscountAmount: discountType === 'PERCENTAGE' && maxDiscountAmount ? Math.round(maxDiscountAmount * 100) : undefined,
          maxUses: 1,
          maxUsesPerUser: 1,
          targetType: 'GLOBAL',
          status: 'ACTIVE',
          startsAt: new Date().toISOString().split('T')[0],
          expiresAt: expiresAt || undefined,
        },
      });
      setResult(res);
      onDone();
    } catch (err: any) {
      setError(err?.message || 'Error al generar cupones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Generar cupones en masa</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result ? (
          <div className="px-6 py-5">
            <div className="rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 mb-4">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                ¡{result.count} cupones generados exitosamente!
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3">
              <div className="grid grid-cols-2 gap-1">
                {result.coupons.slice(0, 20).map((c) => (
                  <span key={c.code} className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700">
                    {c.code}
                  </span>
                ))}
                {result.coupons.length > 20 && (
                  <span className="col-span-2 text-xs text-zinc-400 text-center py-1">+ {result.coupons.length - 20} más</span>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={onClose} className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00]">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="px-6 py-5 space-y-4">
            <p className="text-xs text-zinc-500">Genera múltiples códigos únicos de un solo uso. Cada código tendrá el formato <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">PREFIJO-XXXX-XXXX</span>.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prefijo</label>
                <input required className={inputClass} value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="PIUMS" maxLength={10} />
              </div>
              <div>
                <label className={labelClass}>Cantidad (máx. 500)</label>
                <input required type="number" min={1} max={500} className={inputClass} value={count} onChange={(e) => setCount(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tipo de descuento</label>
                <select className={inputClass} value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Monto fijo ($)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{discountType === 'PERCENTAGE' ? 'Descuento (%)' : 'Descuento ($)'}</label>
                <input required type="number" min={0} step={discountType === 'PERCENTAGE' ? 1 : 0.01} className={inputClass} value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value))} />
              </div>
            </div>

            {discountType === 'PERCENTAGE' && (
              <div>
                <label className={labelClass}>Descuento máximo ($) <span className="text-zinc-400 font-normal">— cap para evitar descuentos desproporcionados</span></label>
                <input type="number" min={0} step={0.01} className={inputClass} value={maxDiscountAmount ?? ''} onChange={(e) => setMaxDiscountAmount(e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="Sin límite" />
              </div>
            )}

            <div>
              <label className={labelClass}>Válido hasta (opcional)</label>
              <input type="date" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
                {loading ? 'Generando...' : `Generar ${count} cupones`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── EmailModal ───────────────────────────────────────────────────────────────

function EmailModal({
  coupon,
  onClose,
}: {
  coupon: AdminCoupon;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await couponsApi.sendEmail(coupon.id, email, recipientName);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el email');
    } finally {
      setSending(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(coupon.code)}`;
  const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Enviar cupón por email</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* QR Preview */}
          <div className="mb-5 flex flex-col items-center gap-2">
            <img src={qrUrl} alt={`QR ${coupon.code}`} className="rounded-lg border border-zinc-200 dark:border-zinc-700" width={150} height={150} />
            <span className="text-lg font-bold tracking-widest text-zinc-900 dark:text-zinc-50">{coupon.code}</span>
            <span className="text-sm text-zinc-500">{coupon.name}</span>
          </div>

          {sent ? (
            <div className="rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-center">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">¡Email enviado exitosamente!</p>
              <button onClick={onClose} className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nombre del destinatario</label>
                <input
                  required
                  className={inputClass}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="María García"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CouponsContent() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null);
  const [emailCoupon, setEmailCoupon] = useState<AdminCoupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page, statusFilter],
    queryFn: () => couponsApi.list({ page, limit: 20, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (d: Partial<AdminCoupon>) => couponsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminCoupon> }) => couponsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setEditCoupon(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setDeleteConfirm(null); },
  });

  const coupons: AdminCoupon[] = (data as any)?.coupons ?? [];
  const total: number = (data as any)?.total ?? 0;
  const totalPages: number = (data as any)?.totalPages ?? 1;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cupones</h1>
          <p className="mt-1 text-sm text-zinc-500">{total.toLocaleString()} cupones en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8m-8 4h4" />
            </svg>
            Generar en masa
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#FF6A00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e05e00] transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cupón
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'ACTIVE', 'PAUSED', 'EXPIRED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#FF6A00] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-sm">No hay cupones todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                  {['Código', 'Nombre', 'Tipo', 'Valor', 'Validaciones / Usos', 'Target', 'Válido hasta', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#FF6A00] tracking-wider">{c.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</p>
                      {c.description && <p className="text-xs text-zinc-400 mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {DISCOUNT_TYPE_LABELS[c.discountType] ?? c.discountType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatDiscount(c)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-600 dark:text-zinc-400 text-xs space-y-0.5">
                        <div title="Veces validado vs usado">
                          <span className="text-zinc-400">Val:</span>{' '}
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.validationCount ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Usos:</span>{' '}
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.currentUses}{c.maxUses ? `/${c.maxUses}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {TARGET_TYPE_LABELS[c.targetType] ?? c.targetType}
                      {c.targetId && <span className="block text-xs text-zinc-400 truncate max-w-[80px]">{c.targetId}</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[c.status]?.className ?? ''}`}>
                        {STATUS_LABELS[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => setEditCoupon(c)}
                          title="Editar"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Send email */}
                        <button
                          onClick={() => setEmailCoupon(c)}
                          title="Enviar por email"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          title="Eliminar"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Anterior
          </button>
          <span className="text-sm text-zinc-500">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Bulk generate modal */}
      {bulkOpen && (
        <BulkGenerateModal
          onClose={() => setBulkOpen(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ['admin-coupons'] })}
        />
      )}

      {/* Create modal */}
      {modalOpen && (
        <CouponModal
          initial={emptyForm()}
          onClose={() => setModalOpen(false)}
          onSave={(d) => createMutation.mutate(d)}
          saving={createMutation.isPending}
        />
      )}

      {/* Edit modal */}
      {editCoupon && (
        <CouponModal
          initial={editCoupon}
          onClose={() => setEditCoupon(null)}
          onSave={(d) => updateMutation.mutate({ id: editCoupon.id, data: d })}
          saving={updateMutation.isPending}
        />
      )}

      {/* Email modal */}
      {emailCoupon && (
        <EmailModal coupon={emailCoupon} onClose={() => setEmailCoupon(null)} />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">¿Eliminar cupón?</h3>
            <p className="text-sm text-zinc-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CouponsPage() {
  return (
    <AdminGuard>
      <CouponsContent />
    </AdminGuard>
  );
}
