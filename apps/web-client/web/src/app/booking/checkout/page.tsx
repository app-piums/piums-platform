'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { sdk } from '@piums/sdk';
import type { Booking } from '@piums/sdk';
import { toast } from '@/lib/toast';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatScheduledDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}

function durationLabel(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} h ${mins} min`;
  if (hrs > 0) return `${hrs} hora${hrs !== 1 ? 's' : ''}`;
  return `${mins} min`;
}

const STEPS = [
  { label: 'Detalles', num: 1 },
  { label: 'Reservas', num: 2 },
  { label: 'Pago', num: 3 },
];

function StepsHeader({ current }: { current: number }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard">
          <Image src="/logo.png" alt="PIUMS" width={28} height={28} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done = step.num < current;
            const active = step.num === current;
            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center min-w-[56px]">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : step.num}
                  </div>
                  <span className={`text-[11px] mt-1 font-medium ${done ? 'text-green-500' : active ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
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
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <InfoIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Ayuda</span>
        </button>
      </div>
    </header>
  );
}

function BookingSummary({ booking }: { booking: Booking }) {
  const { date, time } = formatScheduledDate(booking.scheduledDate);
  const endTime = addMinutesToIso(booking.scheduledDate, booking.durationMinutes);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center">
          <ClipboardIcon className="h-4 w-4 text-[#FF6B35]" />
        </div>
        <h2 className="font-semibold text-gray-900">Resumen de la Reserva</h2>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-xl bg-orange-50 shrink-0 flex items-center justify-center">
            <ClipboardIcon className="h-6 w-6 text-[#FF6B35]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug">
              {(booking as any).serviceName || 'Servicio'}
            </p>
            {(booking as any).artistName && (
              <p className="text-xs text-gray-400 mt-0.5">con {(booking as any).artistName}</p>
            )}
            <span className="inline-block mt-1 text-[10px] font-semibold bg-orange-100 text-[#FF6B35] px-2 py-0.5 rounded-full">
              #{(booking as any).code || booking.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <CalendarIcon className="h-4 w-4 text-[#FF6B35] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Fecha</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ClockIcon className="h-4 w-4 text-[#FF6B35] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {time} &ndash; {endTime}{' '}
                <span className="text-xs text-gray-400">({durationLabel(booking.durationMinutes)})</span>
              </p>
            </div>
          </div>
          {booking.location && (
            <div className="flex items-start gap-2.5">
              <ShieldIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-snug">{booking.location}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Servicio base</span>
            <span className="font-medium">{booking.currency} {centsToDisplay(booking.servicePrice)}</span>
          </div>
          {booking.addonsPrice > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Add-ons</span>
              <span className="font-medium">{booking.currency} {centsToDisplay(booking.addonsPrice)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800 text-base">
            <span>Total del servicio</span>
            <span>{booking.currency} {centsToDisplay(booking.totalPrice)}</span>
          </div>
          {booking.anticipoRequired && booking.anticipoAmount != null && (
            <>
              <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-[#FF6B35] text-base">
                <span>Anticipo a pagar ahora</span>
                <span>{booking.currency} {centsToDisplay(booking.anticipoAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Saldo restante (cobro 72h antes del evento)</span>
                <span>{booking.currency} {centsToDisplay(booking.totalPrice - booking.anticipoAmount)}</span>
              </div>
            </>
          )}
          {!booking.anticipoRequired && (
            <div className="border-t border-orange-200 pt-2 flex justify-between font-bold text-[#FF6B35] text-base">
              <span>A pagar ahora</span>
              <span>{booking.currency} {centsToDisplay(booking.totalPrice)}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
          <ShieldIcon className="h-3.5 w-3.5 text-green-500" />
          Cancelación gratuita dentro de las primeras 48 horas
        </p>
      </div>
    </div>
  );
}

function PaymentFormInner({ booking, bookingId }: { booking: Booking; bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'paypal'>('card');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const amountDue = booking.anticipoRequired && booking.anticipoAmount != null
    ? booking.anticipoAmount
    : booking.totalPrice;

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (paymentMethod === 'transfer' || paymentMethod === 'paypal') {
        router.push(`/booking/confirmation/${bookingId}`);
        return;
      }
      if (!stripe || !elements) {
        setErrorMsg('Stripe no está listo. Por favor recarga la página.');
        setSubmitting(false);
        return;
      }
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/booking/confirmation/${bookingId}` },
        redirect: 'if_required',
      });
      if (error) {
        const msg = error.message || 'Error al procesar el pago. Por favor intenta de nuevo.';
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        try { sessionStorage.removeItem(`piums_pi_${bookingId}`); } catch {}
        toast.success('¡Pago procesado exitosamente!');
        router.push(`/booking/confirmation/${bookingId}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al procesar el pago';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const methods = [
    { id: 'card' as const, label: 'Tarjeta', icon: <CreditCardIcon className="h-4 w-4" /> },
    { id: 'transfer' as const, label: 'Transferencia', icon: <BankIcon className="h-4 w-4" /> },
    { id: 'paypal' as const, label: 'PayPal', icon: <PayPalIcon className="h-4 w-4" /> },
  ];

  const canSubmit = paymentMethod === 'transfer' || paymentMethod === 'paypal' || (!!stripe && !!elements);

  return (
    <div className="space-y-5">
      {booking.anticipoRequired && booking.anticipoAmount != null && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
          <InfoIcon className="h-5 w-5 text-[#FF6B35] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Pago en dos partes</p>
            <p className="text-sm text-orange-700 mt-0.5">
              Pagas el anticipo de <strong>{booking.currency} {centsToDisplay(booking.anticipoAmount)}</strong> ahora
              para confirmar la reserva. El saldo restante (<strong>{booking.currency} {centsToDisplay(booking.totalPrice - booking.anticipoAmount)}</strong>) se cobrará automáticamente 72 horas antes del evento.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Notas para el Artista</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value.slice(0, 300))}
          placeholder="¿Tienes algún requerimiento especial o idea para la sesión?"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition placeholder:text-gray-300"
        />
        <p className="text-right text-xs text-gray-300 mt-1">{notes.length}/300</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Método de Pago</h2>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
            <LockIcon className="h-3 w-3 text-green-600" />
            <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Pago seguro encriptado</span>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === m.id ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {paymentMethod === 'card' && (
          <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['card'] }} />
        )}

        {paymentMethod === 'transfer' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-800">Datos para Transferencia / Depósito</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Banco</span><span className="font-medium text-gray-900">Banrural Guatemala</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Cuenta Monetaria</span><span className="font-medium text-gray-900 font-mono">3-123-456789-0</span></div>
                <div className="flex justify-between"><span className="text-gray-500">A nombre de</span><span className="font-medium text-gray-900">PIUMS S.A.</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto</span>
                  <span className="font-bold text-[#FF6B35]">{booking.currency} {centsToDisplay(amountDue)}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
              <InfoIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Después de realizar la transferencia, envía el comprobante a <strong>soporte@piums.io</strong>. Tu reserva se confirmará en menos de 2 horas hábiles.
              </p>
            </div>
          </div>
        )}

        {paymentMethod === 'paypal' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40">
            <PayPalIcon className="h-12 w-12 text-[#003087]" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">Pago con PayPal</p>
              <p className="text-xs text-gray-500 mt-1">La integración con PayPal estará disponible próximamente.<br />Mientras tanto, usa Transferencia o Tarjeta.</p>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">Próximamente</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <InfoIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canSubmit || submitting}
          className="w-full py-4 bg-[#FF6B35] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 text-base"
        >
          {submitting ? (
            <><div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando...</>
          ) : paymentMethod === 'card' ? (
            <>
              {booking.anticipoRequired ? 'Pagar Anticipo ' : 'Confirmar y Pagar '}
              {booking.currency} {centsToDisplay(amountDue)}
              <ArrowRightIcon className="h-5 w-5" />
            </>
          ) : (
            <>Confirmar Reserva<ArrowRightIcon className="h-5 w-5" /></>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Al hacer clic aceptas los{' '}
          <Link href="/" className="underline hover:text-gray-600">Términos del Servicio</Link>
          {' '}y{' '}
          <Link href="/" className="underline hover:text-gray-600">Política de Privacidad</Link>
          {' '}de PIUMS
        </p>
      </div>
    </div>
  );
}

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState<number | null>(null);
  const [creditCurrency, setCreditCurrency] = useState('USD');

  useEffect(() => {
    if (!bookingId) {
      setError('No se proporcionó un ID de reserva válido.');
      setLoading(false);
      return;
    }

    sdk.getMyCredits().then(res => {
      if (res.totalAmount > 0) {
        setCreditAmount(res.totalAmount);
        setCreditCurrency(res.currency);
      }
    }).catch(() => {});

    const load = async () => {
      try {
        const bookingData = await sdk.getBooking(bookingId);
        if (!bookingData) throw new Error('Reserva no encontrada');
        setBooking(bookingData);

        let storedSecret: string | null = null;
        try { storedSecret = sessionStorage.getItem(`piums_pi_${bookingId}`); } catch {}

        if (storedSecret) {
          setClientSecret(storedSecret);
          return;
        }

        const amountForIntent = bookingData.anticipoRequired && bookingData.anticipoAmount != null
          ? bookingData.anticipoAmount
          : bookingData.totalPrice;

        // initCheckout enruta automáticamente a Tilopay (LATAM) o Stripe (internacional)
        const pi = await sdk.initCheckout(
          bookingId,
          amountForIntent,
          bookingData.currency || 'USD',
          (bookingData as any).clientCountryCode,
        );

        // Tilopay: redirigir al usuario a la página de pago hosteada
        if (pi.redirectUrl) {
          window.location.href = pi.redirectUrl;
          return;
        }

        // Stripe: usar clientSecret con Stripe Elements
        if (!pi.clientSecret) throw new Error('No se recibió el token de pago del servidor');

        setClientSecret(pi.clientSecret);
        try { sessionStorage.setItem(`piums_pi_${bookingId}`, pi.clientSecret); } catch {}
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar la página de pago';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <StepsHeader current={3} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Preparando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking || !clientSecret) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <StepsHeader current={3} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <InfoIcon className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No se pudo cargar el pago</h2>
            <p className="text-sm text-gray-500 mb-4">{error || 'Ocurrió un problema inesperado.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-[#FF6B35] text-white rounded-lg font-semibold text-sm"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#FF6B35',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#EF4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <StepsHeader current={3} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24">
            <BookingSummary booking={booking} />
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            {creditAmount !== null && creditAmount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800">
                    Tienes {creditCurrency} {centsToDisplay(creditAmount)} de crédito disponible
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Los créditos se aplicarán automáticamente al procesar el pago. Válidos por 90 días desde su emisión.
                  </p>
                </div>
              </div>
            )}
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentFormInner booking={booking} bookingId={bookingId!} />
            </Elements>
          </div>
        </div>
      </main>
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">&copy; 2026 Piums &ndash; Economía Naranja. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3 text-gray-300">
            <LockIcon className="h-4 w-4" />
            <ShareIcon className="h-4 w-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>;
}
function InfoIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ClipboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
function CreditCardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function ArrowRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
}
function ShareIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
}
function BankIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" /></svg>;
}
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.013 3.13-.573 4.913-3.636 4.913h-4.458c-.524 0-.968.382-1.05.9l-1.17 7.412H9.35c-.457 0-.785.406-.714.858l1.226-7.774a1.044 1.044 0 0 1 1.033-.888h2.15c4.12 0 7.327-1.674 8.267-6.52.33-1.697.177-3.128-.89-4.36z" />
    </svg>
  );
}