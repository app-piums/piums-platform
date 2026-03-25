'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Loading } from '@/components/Loading';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { sdk, type Service, type ArtistProfile, type Booking } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';

// Icons
const ClockIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const StarFilledIcon = ({ className }: { className?: string }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon },
  completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
};

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
      {icon}
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </div>
  );
}

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[BOOKING DETAIL] params.id:', params.id);
        // Fetch Booking
        const b = await sdk.getBooking(params.id);
        console.log('[BOOKING DETAIL] getBooking result:', b);
        if (!b) throw new Error('Reserva no encontrada');
        
        if (isMounted) setBooking(b);
        
        // Parallel fetch for associated service and artist
        if (b.serviceId) {
          console.log('[BOOKING DETAIL] Fetching service for booking:', b.serviceId);
          const s = await sdk.getService(b.serviceId).catch(() => null);
          console.log('[BOOKING DETAIL] getService result:', s);
          if (isMounted) setService(s);
        }
        
        if (b.artistId) {
          console.log('[BOOKING DETAIL] Fetching artist for booking:', b.artistId);
          const a = await sdk.getArtist(b.artistId).catch(() => null);
          console.log('[BOOKING DETAIL] getArtist result:', a);
          if (isMounted && a) setArtist(a);
        }
        
      } catch (err) {
        console.error('[BOOKING DETAIL] Error fetching booking load data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }

    return () => { isMounted = false; };
  }, [params.id, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !booking) {
    console.error('Booking detail error:', error, 'Booking:', booking);
    // Seguridad: nunca renderizar nada de servicio si no hay booking
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xl font-semibold text-gray-900 mb-3">
            {error || 'No pudimos encontrar los detalles de esta reserva.'}
          </p>
          <Link
            href="/bookings"
            className="px-6 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl shadow-lg hover:bg-orange-600 transition"
          >
            Volver a mis reservas
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Seguridad extra: si booking no existe, no renderizar nada de servicio
  if (!booking) {
    return null;
  }
  // Formatting helpers
  const st = STATUS_MAP[booking.status?.toLowerCase()] || STATUS_MAP['pending'];
  const StatusIcon = st.icon;
  
  const rawDate = booking.scheduledDate || booking.startAt;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha pendiente';
  const formattedTime = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  
  const DisplayImage = service?.images?.[0] || artist?.coverPhoto || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200';
  const priceVal = Number(booking.totalPrice || booking.amount || 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 lg:py-8">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mis Reservas', href: '/bookings' },
            { label: 'Detalles' }
          ]}
          className="mb-6"
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* ── IZQUIERDA: Detalles Visuales de la Reserva ── */}
          <div className="flex-1 min-w-0 space-y-6">
            
            {/* Hero image en proporciones épicas */}
            <div className="relative w-full aspect-[16/9] lg:aspect-[2/1] rounded-2xl overflow-hidden bg-gray-200">
              {/* Usamos tag object-cover o Image */}
              <img
                src={DisplayImage}
                alt={service?.name || booking.serviceName || 'Servicio Piums'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow flex items-center gap-1.5 ${st.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {st.label.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Cabezote: Título y Artista */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                {service?.name || booking.serviceName || 'Reserva de Servicio PIUMS'}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                Reservado con{' '}
                <span className="text-[#FF6A00] font-semibold">{artist?.nombre || booking.artistName || 'Profesional'}</span>
                {' '}·{' '}
                <span>ID: {booking.id.split('-')[0].toUpperCase()}</span>
              </p>
            </div>

            {/* Fila de Estadísticas/Info */}
            <div className="flex flex-wrap gap-4">
              <StatPill icon={<ClockIcon className="h-4 w-4 text-gray-400" />} label="Confirmación Instantánea" />
              {artist?.rating && (
                <StatPill icon={<StarFilledIcon className="h-4 w-4 text-yellow-400" />} label={`${artist.rating} / ${artist.reviewsCount || 0} reseñas`} />
              )}
            </div>

            {/* Información del Servicio */}
            {service?.description && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Sobre tu Servicio</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>

                {artist?.bio && (
                  <blockquote className="border-l-4 border-[#FF6A00] bg-orange-50 rounded-r-xl pl-4 pr-4 py-3 mt-4">
                    <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                      <StarFilledIcon className="h-3.5 w-3.5 text-[#FF6A00]" />
                       Artista
                    </p>
                    <p className="text-sm text-orange-900 italic leading-relaxed">{artist.bio}</p>
                  </blockquote>
                )}
              </section>
            )}

            {/* Qué Incluye */}
            {service?.whatIsIncluded && service.whatIsIncluded.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">¿Qué incluye?</h2>
                <ul className="space-y-2.5">
                  {service.whatIsIncluded.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircleIcon className="h-3 w-3 text-green-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </div>

          {/* ── DERECHA: Resumen Estático Sticky (Premium Widget) ── */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-6">
            
            <div className="sticky top-28 space-y-6">
              
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-4 flex items-center justify-between gap-3 ${booking.status === 'completed' ? 'bg-blue-600' : 'bg-[#FF6A00]'}`}>
                  <span className="text-white font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Resumen del Evento
                  </span>
                </div>
                
                <div className="p-5 space-y-5">
                  
                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Fecha Programada</p>
                    <p className="font-semibold text-gray-900 capitalize">{formattedDate}</p>
                    <p className="text-sm text-[#FF6A00] font-medium mt-0.5">{formattedTime}</p>
                  </div>

                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Ubicación</p>
                    <p className="text-sm text-gray-800 font-medium break-words">
                      {booking.location || 'Dirección no proporcionada en la reserva.'}
                    </p>
                  </div>

                  {/* Pricing Breakdown Simulado */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Servicio Base</span>
                      <span className="text-sm font-medium text-gray-900">Q{priceVal.toLocaleString()}</span>
                    </div>
                    {/* Si hubiera traslados o fees se listarían aquí filtrando metadata */}
                    
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total Pagado</span>
                      <span className="text-lg font-black text-[#FF6A00]">Q{priceVal.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

                {/* Acciones del Dashboard Widget */}
                <div className="bg-gray-50 p-5 px-5 flex flex-col gap-3">
                   {booking.status === 'completed' && (
                     <button className="w-full py-2.5 bg-white border border-[#FF6A00] text-[#FF6A00] font-semibold rounded-xl text-sm hover:bg-orange-50 transition">
                       Dejar Reseña del Servicio
                     </button>
                   )}
                   <button onClick={() => window.print()} className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition">
                     Descargar Recibo (PDF)
                   </button>
                   <Link href={`/services/${booking.serviceId || '1'}`} className="text-center text-xs text-gray-500 hover:text-[#FF6A00] transition pt-1">
                     Agendar una nueva cita similar
                   </Link>
                </div>
              </div>

              {/* Tips de Seguridad */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Reserva Protegida
                </h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li>Tu dinero está asegurado por la plataforma hasta la culminación de la sesión.</li>
                  <li>Tienes cobertura de garantía en caso de fuerza mayor según nuestros términos.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
