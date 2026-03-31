'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Mock booking summary data ────────────────────────────────────────────────
const BOOKING = {
  serviceTitle: 'Sesión de Fotografía Creativa',
  artistName: 'Alex Martínez',
  artistAvatar: '',
  rating: 4.8,
  reviewCount: 333,
  date: 'Viernes, 24 Noviembre 2023',
  timeStart: '10:00 AM',
  timeEnd: '12:00 PM',
  durationLabel: '2 Horas',
  imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80',
  priceBase: 103.78,
  piumsFee: 10.22,
  discount: -8.00,
  discountLabel: 'Descuento "Add on 2"',
  total: 122.00,
  cancellationNote: 'Cancelación gratuita hasta 34 horas antes',
};

// ─── Steps header ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Detalles', num: 1 },
  { label: 'Reservas',  num: 2 },
  { label: 'Pago',      num: 3 },
];

function StepsHeader({ current }: { current: number }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard">
          <Image src="/logo.jpg" alt="PIUMS" width={90} height={30} className="h-7 w-auto" />
        </Link>

        {/* Steps */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done   = step.num < current;
            const active = step.num === current;
            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center min-w-[56px]">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done   ? 'bg-green-500 border-green-500 text-white'
                    : active ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : step.num}
                  </div>
                  <span className={`text-[11px] mt-1 font-medium ${
                    done ? 'text-green-500' : active ? 'text-[#FF6A00]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 md:w-24 h-0.5 mb-4 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Help */}
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <InfoIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Ayuda</span>
        </button>
      </div>
    </header>
  );
}

// ─── Left: booking summary ────────────────────────────────────────────────────
function BookingSummary() {
  const b = BOOKING;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center">
          <ClipboardIcon className="h-4 w-4 text-[#FF6A00]" />
        </div>
        <h2 className="font-semibold text-gray-900">Resumen de la Reserva</h2>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Service row */}
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            <Image
              src={b.imageUrl}
              alt={b.serviceTitle}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug">{b.serviceTitle}</p>
            <p className="text-xs text-gray-400 mt-0.5">con {b.artistName}</p>
            <div className="flex items-center gap-1 mt-1">
              <StarFilledIcon className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{b.rating}</span>
              <span className="text-xs text-gray-400">({b.reviewCount} reseñas)</span>
            </div>
          </div>
        </div>

        {/* Date & time */}
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <CalendarIcon className="h-4 w-4 text-[#FF6A00] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Fecha</p>
              <p className="text-sm font-medium text-gray-800">{b.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ClockIcon className="h-4 w-4 text-[#FF6A00] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {b.timeStart} – {b.timeEnd}{' '}
                <span className="text-xs text-gray-400">({b.durationLabel})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Servicio Artístico (x2 hrs)</span>
            <span className="font-medium">Q{b.priceBase.toLocaleString('es-GT')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tarifa de servicio Piums</span>
            <span className="font-medium">Q{b.piumsFee.toLocaleString('es-GT')}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>{b.discountLabel}</span>
            <span className="font-medium">Q{b.discount.toLocaleString('es-GT')}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-[#FF6A00] text-base">
            <span>Total a pagar</span>
            <span>Q{b.total.toLocaleString('es-GT')}</span>
          </div>
        </div>

        {/* Cancellation */}
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
          <ShieldIcon className="h-3.5 w-3.5 text-green-500" />
          {b.cancellationNote}
        </p>
      </div>
    </div>
  );
}

// ─── Right: notes + payment form ─────────────────────────────────────────────
function PaymentForm() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card' | 'paypal'>('transfer');
  const [cardNumber, setCardNumber]   = useState('');
  const [expiry, setExpiry]           = useState('');
  const [cvc, setCvc]                 = useState('');
  const [cardName, setCardName]       = useState('');
  const [saveCard, setSaveCard]       = useState(false);
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    router.push('/booking/confirmation');
  };

  const canSubmit = paymentMethod === 'transfer' || paymentMethod === 'paypal'
    || (cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvc.length >= 3 && cardName.trim().length > 2);

  const methods = [
    { id: 'transfer' as const, label: 'Transferencia', icon: <BankIcon className="h-4 w-4" /> },
    { id: 'card'     as const, label: 'Tarjeta',       icon: <CreditCardIcon className="h-4 w-4" /> },
    { id: 'paypal'   as const, label: 'PayPal',        icon: <PayPalIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Notas para el Artista</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¿Tienes algún requerimiento especial o idea para la sesión?"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300"
        />
        <p className="text-right text-xs text-gray-300 mt-1">{notes.length}/300</p>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Método de Pago</h2>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
            <LockIcon className="h-3 w-3 text-green-600" />
            <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Pago seguro encriptado</span>
          </div>
        </div>

        {/* 3-method selector */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === m.id
                  ? 'bg-white shadow text-gray-900 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Transfer instructions */}
        {paymentMethod === 'transfer' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-800">Datos para Transferencia / Depósito</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Banco</span>
                  <span className="font-medium text-gray-900">Banrural Guatemala</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cuenta Monetaria</span>
                  <span className="font-medium text-gray-900 font-mono">3-123-456789-0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">A nombre de</span>
                  <span className="font-medium text-gray-900">PIUMS S.A.</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
              <InfoIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Después de realizar la transferencia, envía el comprobante a <strong>pagos@piums.com</strong>. Tu reserva se confirmará en menos de 2 horas hábiles.
              </p>
            </div>
          </div>
        )}

        {/* Card form */}
        {paymentMethod === 'card' && (
          <div className="space-y-3">
            {/* Card number */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Número de Tarjeta
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 1234 1234 1234"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300 font-mono tracking-widest"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <div className="h-4 w-6 bg-blue-600 rounded-sm opacity-90" />
                  <div className="h-4 w-6 bg-red-500 rounded-sm opacity-90 -ml-2" />
                </div>
              </div>
            </div>

            {/* Expiry + CVC */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Fecha de Expiración
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM / AA"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  CVC{' '}
                  <span className="text-gray-300">(3 dígitos)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="CVC"
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300"
                  />
                  <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Card name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Nombre en la tarjeta
              </label>
              <input
                type="text"
                placeholder="Como aparece en la tarjeta"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/30 focus:border-[#FF6A00] transition placeholder:text-gray-300"
              />
            </div>

            {/* Save card */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => setSaveCard(v => !v)}
                className={`h-4.5 w-4.5 h-[18px] w-[18px] rounded border-2 flex items-center justify-center transition-all ${
                  saveCard ? 'bg-[#FF6A00] border-[#FF6A00]' : 'border-gray-300 group-hover:border-[#FF6A00]'
                }`}
              >
                {saveCard && <CheckIcon className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className="text-sm text-gray-600">Guardar tarjeta para futuras reservas</span>
            </label>
          </div>
        )}

        {/* PayPal placeholder */}
        {paymentMethod === 'paypal' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40">
            <PayPalIcon className="h-12 w-12 text-[#003087]" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">Pago con PayPal</p>
              <p className="text-xs text-gray-500 mt-1">
                La integración con PayPal estará disponible próximamente.<br />
                Mientras tanto, usa Transferencia o Tarjeta.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">
              Próximamente en producción
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleConfirm}
          disabled={!canSubmit || submitting}
          className="w-full py-4 bg-[#FF6A00] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 text-base"
        >
          {submitting ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Confirmar y Pagar ${BOOKING.total.toFixed(2)}
              <ArrowRightIcon className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Al hacer clic en aceptar los{' '}
          <Link href="/" className="underline hover:text-gray-600">Términos del Servicio</Link>
          {' '}y{' '}
          <Link href="/" className="underline hover:text-gray-600">Política de Privacidad</Link>
          {' '}de PIUMS
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <StepsHeader current={3} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: summary */}
          <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24">
            <BookingSummary />
          </div>

          {/* Right: form */}
          <div className="flex-1 min-w-0">
            <PaymentForm />
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © 2026 Piums – Economía Naranja. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-3 text-gray-300">
            <LockIcon className="h-4 w-4" />
            <ShareIcon className="h-4 w-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" />
    </svg>
  );
}
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.013 3.13-.573 4.913-3.636 4.913h-4.458c-.524 0-.968.382-1.05.9l-1.17 7.412H9.35c-.457 0-.785.406-.714.858l1.226-7.774a1.044 1.044 0 0 1 1.033-.888h2.15c4.12 0 7.327-1.674 8.267-6.52.33-1.697.177-3.128-.89-4.36z" />
    </svg>
  );
}
