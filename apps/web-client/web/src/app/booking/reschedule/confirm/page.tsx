'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type State = 'loading' | 'success' | 'error' | 'expired';

function ConfirmRescheduleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('No se encontró el token de confirmación. El enlace puede estar incompleto.');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/reschedule-requests/confirm?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setState('success');
          setBookingId(data.booking?.id || null);
          setNewDate(data.booking?.scheduledDate || null);
        } else if (res.status === 410) {
          setState('expired');
          setMessage(data.message || 'El enlace ha expirado.');
        } else {
          setState('error');
          setMessage(data.message || 'No se pudo confirmar el cambio de fecha.');
        }
      } catch {
        setState('error');
        setMessage('Error de conexión. Por favor intenta de nuevo.');
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {state === 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-[#FF6B35] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Confirmando cambio de fecha...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-10 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cambio confirmado!</h1>
            {newDate && (
              <p className="text-gray-600 mb-1">
                Tu reserva ha sido reprogramada para el{' '}
                <span className="font-semibold text-gray-900">
                  {new Date(newDate).toLocaleDateString('es-GT', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-8">El artista ha sido notificado de la confirmación.</p>
            {bookingId ? (
              <Link
                href={`/bookings/${bookingId}`}
                className="inline-block px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-orange-600 transition"
              >
                Ver mi reserva
              </Link>
            ) : (
              <Link
                href="/bookings"
                className="inline-block px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-orange-600 transition"
              >
                Ir a mis reservas
              </Link>
            )}
          </div>
        )}

        {state === 'expired' && (
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-10 text-center">
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace expirado</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <Link
              href="/bookings"
              className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition"
            >
              Ver mis reservas
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-8">{message || 'No se pudo confirmar el cambio de fecha.'}</p>
            <Link
              href="/bookings"
              className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition"
            >
              Ver mis reservas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmReschedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    }>
      <ConfirmRescheduleContent />
    </Suspense>
  );
}
