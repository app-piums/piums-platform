'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { Loading } from '@/components/Loading';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReviewModal } from '@/components/bookings/ReviewModal';
import { ModifyDateModal } from '@/components/bookings/ModifyDateModal';
import { sdk, type Service, type ArtistProfile, type Booking, type BookingCollaborator } from '@piums/sdk';
import { formatArtistCategory } from '@/lib/artistCategory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { cImg } from '@/lib/cloudinaryImg';
import { Clock as LucideClock, CheckCircle as LucideCheckCircle } from 'lucide-react';
import { generateBookingReceipt } from '@/lib/generateReceipt';

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
  delivered: { label: 'Entregada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  cancelled_client: { label: 'Cancelada por cliente', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  cancelled_artist: { label: 'Cancelada por artista', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  no_show: { label: 'No se presentó', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon },
  in_progress: { label: 'En curso', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ClockIcon },
  payment_pending: { label: 'Pago pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon },
  payment_completed: { label: 'Pago completo', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon },
  anticipo_paid: { label: 'Anticipo pagado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircleIcon },
  rescheduled: { label: 'Reprogramada', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ClockIcon },
  reschedule_pending_artist: { label: 'Cambio pendiente (artista)', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ClockIcon },
  reschedule_pending_client: { label: 'Cambio pendiente (cliente)', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ClockIcon },
};

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
      {icon}
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </div>
  );
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [isModifyDateOpen, setIsModifyDateOpen] = useState(false);
  const [rescheduleRequestSent, setRescheduleRequestSent] = useState(false);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [noShowSubmitting, setNoShowSubmitting] = useState(false);
  const [noShowDone, setNoShowDone] = useState(false);
  const [payingRemaining, setPayingRemaining] = useState(false);
  const [payingSonidista, setPayingSonidista] = useState(false);
  const [collaborators, setCollaborators] = useState<BookingCollaborator[]>([]);
  const [replacementSearch, setReplacementSearch] = useState<{
    id: string; status: string; matchedServiceIds: string[]; matchedArtistIds: string[];
    expiresAt: string; category: string | null; city: string | null; scheduledDate: string;
  } | null>(null);
  const [replacementAction, setReplacementAction] = useState<'idle' | 'accepting' | 'declining'>('idle');

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
        const b = await sdk.getBooking(id);
        if (!b) throw new Error('Reserva no encontrada');
        
        if (isMounted) {
          setBooking(b);
          if (b.reviewId) setReviewed(true);
        }
        
        // Parallel fetch for associated service, artist, and collaborators
        const [s, a, collabs] = await Promise.all([
          b.serviceId ? sdk.getService(b.serviceId).catch(() => null) : Promise.resolve(null),
          b.artistId  ? sdk.getArtist(b.artistId).catch(() => null)  : Promise.resolve(null),
          sdk.getBookingCollaborators(id).catch(() => ({ collaborators: [] as BookingCollaborator[] })),
        ]);
        if (isMounted) {
          setService(s);
          if (a) setArtist(a);
          setCollaborators((collabs.collaborators ?? []).filter((c: BookingCollaborator) => c.status === 'ACCEPTED'));
        }

        // Fetch replacement search for artist-cancelled bookings
        if (b.status?.toUpperCase() === 'CANCELLED_ARTIST') {
          const rep = await sdk.getReplacementSearch(id).catch(() => null);
          if (isMounted && rep) setReplacementSearch(rep as any);
        }
        
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error al cargar la reserva');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }

    return () => { isMounted = false; };
  }, [id, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={userName} />
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xl font-semibold text-gray-900 mb-2">Reserva no encontrada</p>
          <p className="text-sm text-gray-500 mb-5">{error || 'No pudimos encontrar los detalles de esta reserva.'}</p>
          <Link href="/bookings" className="px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl shadow-lg hover:bg-orange-600 transition">
            Volver a mis reservas
          </Link>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const st = STATUS_MAP[booking.status?.toLowerCase()] || STATUS_MAP['pending'];
  const StatusIcon = st.icon;
  
  const rawDate = booking.scheduledDate || booking.startAt;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha pendiente';
  const formattedTime = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  
  const DisplayImage = service?.images?.[0] || artist?.coverPhoto || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200';
  const cancelReason = booking.cancellationReason || booking.cancelReason;
  const canReview = booking.status?.toLowerCase() === 'completed' && !reviewed && !booking.reviewId;
  const canAddToEvent = booking.status?.toUpperCase() === 'PENDING' && !booking.eventId;
  const bookingIsUpcoming = dateObj ? dateObj.getTime() > Date.now() + 24 * 60 * 60 * 1000 : false;
  const canRequestReschedule = ['PENDING', 'CONFIRMED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(booking.status?.toUpperCase() || '') && !rescheduleRequestSent && bookingIsUpcoming;
  const hasPendingReschedule = ['RESCHEDULE_PENDING_ARTIST', 'RESCHEDULE_PENDING_CLIENT'].includes(booking.status?.toUpperCase() || '');

  const NO_SHOW_ELIGIBLE = ['CONFIRMED', 'IN_PROGRESS', 'ANTICIPO_PAID', 'PAYMENT_COMPLETED'];
  const eventPassed = dateObj ? dateObj < new Date() : false;
  const canReportNoShow =
    eventPassed &&
    NO_SHOW_ELIGIBLE.includes(booking.status?.toUpperCase() || '') &&
    !noShowDone &&
    booking.status?.toUpperCase() !== 'NO_SHOW';

  const handleSonidistaCheckout = async () => {
    const sonidistaBooking = (booking as any).sonidistaBooking;
    if (!sonidistaBooking) return;
    setPayingSonidista(true);
    try {
      const intent = await sdk.initCheckout(
        sonidistaBooking.id,
        Number(sonidistaBooking.totalPrice),
        booking!.currency ?? 'USD',
        artist?.country,
        'Sonidista',
      );
      if (intent.redirectUrl) {
        window.location.href = intent.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar el pago del sonidista');
    } finally {
      setPayingSonidista(false);
    }
  };

  const handlePayRemaining = async () => {
    if (!booking) return;
    setPayingRemaining(true);
    try {
      const anticipo = Number(booking.anticipoAmount ?? 0);
      const paid     = Number((booking as any).paidAmount ?? anticipo);
      const remaining = Number(booking.totalPrice) - paid;
      if (remaining <= 0) return;
      const intent = await sdk.initCheckout(
        booking.id,
        remaining,
        booking.currency ?? 'USD',
        artist?.country,
        'Saldo restante de reserva',
        'automatic'
      );
      if (intent.redirectUrl) {
        window.location.href = intent.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar el pago');
    } finally {
      setPayingRemaining(false);
    }
  };

  const handleReportNoShow = async () => {
    setNoShowSubmitting(true);
    try {
      await sdk.reportNoShow(booking.id, noShowReason || undefined);
      setNoShowDone(true);
      setNoShowModalOpen(false);
      setBooking((prev) => prev ? { ...prev, status: 'NO_SHOW' } : prev);
      toast.success('No-show reportado. El equipo de Piums procesará tu caso.');
    } catch (err: any) {
      toast.error(err?.message || 'Error al reportar el no-show');
    } finally {
      setNoShowSubmitting(false);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      await sdk.createReview({ bookingId: booking.id, rating, comment });
      setReviewed(true);
      setIsReviewModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar la reseña');
    }
  };

  const handleAcceptReplacement = async () => {
    if (!booking) return;
    setReplacementAction('accepting');
    try {
      await sdk.acceptReplacement(booking.id);
      setReplacementSearch((prev) => prev ? { ...prev, status: 'SEARCHING' } : prev);
      toast.success('Buscando artistas de reemplazo...');
    } catch (err: any) {
      toast.error(err?.message || 'Error al aceptar reemplazo');
      setReplacementAction('idle');
    }
  };

  const handleDeclineReplacement = async () => {
    if (!booking) return;
    setReplacementAction('declining');
    try {
      await sdk.declineReplacement(booking.id);
      setReplacementSearch((prev) => prev ? { ...prev, status: 'OPTED_OUT' } : prev);
    } catch (err: any) {
      toast.error(err?.message || 'Error');
      setReplacementAction('idle');
    }
  };
  const priceVal = Number(booking.totalPrice || booking.amount || 0) / 100;

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 lg:py-8 pt-20 lg:pt-8">
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
                <span className="text-[#FF6B35] font-semibold">{artist?.nombre || booking.artistName || 'Profesional'}</span>
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
                  <blockquote className="border-l-4 border-[#FF6B35] bg-orange-50 rounded-r-xl pl-4 pr-4 py-3 mt-4">
                    <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                      <StarFilledIcon className="h-3.5 w-3.5 text-[#FF6B35]" />
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
                      <span className="h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="h-4 w-4 text-[#FF6B35]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l1.8 5.4 5.7.4-4.4 3.3 1.6 5.5L12 13.5l-4.7 3.1 1.6-5.5L4.5 7.8l5.7-.4z" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Equipo adicional (colaboradores aceptados) */}
            {collaborators.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Equipo adicional</h2>
                <div className="space-y-3">
                  {collaborators.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {(c as any).artistName || 'Colaborador'}
                        </p>
                        {c.role && (
                          <p className="text-xs text-gray-500">{c.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No-show banner */}
            {(booking.status?.toUpperCase() === 'NO_SHOW' || noShowDone) && (
              <section className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                <XCircleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">No-show reportado</p>
                  <p className="text-sm text-red-600 leading-relaxed">
                    El artista no se presentó. Estamos procesando tu reembolso y un crédito de compensación. Recibirás una notificación cuando esté listo.
                  </p>
                  {booking.noShowReason && (
                    <p className="text-xs text-red-500 mt-2">"{booking.noShowReason}"</p>
                  )}
                </div>
              </section>
            )}

            {/* Reemplazo de emergencia — solo cuando artista canceló */}
            {booking.status?.toUpperCase() === 'CANCELLED_ARTIST' && replacementSearch && (() => {
              const expired = new Date(replacementSearch.expiresAt) <= new Date();
              const s = replacementSearch.status;

              if (s === 'AWAITING_CLIENT' && !expired) {
                const searchParams = new URLSearchParams();
                if (replacementSearch.category) searchParams.set('category', replacementSearch.category);
                if (replacementSearch.city) searchParams.set('city', replacementSearch.city);
                return (
                  <section className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-800">¿Te buscamos un artista de reemplazo?</p>
                        <p className="text-sm text-orange-700 mt-0.5">
                          Podemos encontrar artistas disponibles para tu evento dentro de tu presupuesto.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAcceptReplacement}
                        disabled={replacementAction !== 'idle'}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
                      >
                        {replacementAction === 'accepting' ? (
                          <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Buscando...</>
                        ) : 'Sí, buscar reemplazo'}
                      </button>
                      <button
                        onClick={handleDeclineReplacement}
                        disabled={replacementAction !== 'idle'}
                        className="flex-1 py-2 bg-white border border-orange-200 text-orange-700 font-semibold rounded-xl text-sm hover:bg-orange-50 disabled:opacity-60 transition"
                      >
                        No, prefiero el reembolso
                      </button>
                    </div>
                  </section>
                );
              }

              if (s === 'SEARCHING') {
                return (
                  <section className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-sm font-medium text-orange-800">Buscando artistas disponibles para tu evento...</p>
                  </section>
                );
              }

              if (s === 'NOTIFIED' && !expired) {
                const searchUrl = `/search?${replacementSearch.category ? `category=${replacementSearch.category}&` : ''}${replacementSearch.city ? `city=${encodeURIComponent(replacementSearch.city)}&` : ''}date=${replacementSearch.scheduledDate?.slice(0, 10) ?? ''}`;
                return (
                  <section className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Encontramos {replacementSearch.matchedArtistIds.length} artista(s) disponible(s)
                        </p>
                        <p className="text-sm text-green-700 mt-0.5">
                          Hay artistas listos para tu evento dentro de tu presupuesto original.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={searchUrl}
                      className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm text-center transition"
                    >
                      Ver artistas disponibles
                    </Link>
                  </section>
                );
              }

              if (s === 'NO_MATCHES') {
                return (
                  <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-start gap-3">
                    <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">No encontramos reemplazos disponibles</p>
                      <p className="text-sm text-gray-500 mt-0.5">No hay artistas de tu categoría disponibles para esa fecha en tu zona. Tu reembolso será procesado.</p>
                    </div>
                  </section>
                );
              }

              return null;
            })()}

            {/* Motivo de cancelación */}
            {cancelReason && (
              <section className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
                <XCircleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Motivo de cancelación</p>
                  <p className="text-sm text-red-600 leading-relaxed">{cancelReason}</p>
                </div>
              </section>
            )}

          </div>

          {/* ── DERECHA: Resumen Estático Sticky (Premium Widget) ── */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-6">
            
            <div className="sticky top-28 space-y-6">

              {/* ── Código de Asistencia ── */}
              {(booking.status?.toUpperCase() === 'CONFIRMED' || booking.status?.toUpperCase() === 'IN_PROGRESS') &&
                (booking as any).attendanceCode && (
                <div className="w-full bg-white rounded-2xl border border-[#FF6B35]/30 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-orange-50 border-b border-[#FF6B35]/20 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-sm font-semibold text-[#FF6B35]">Código de Asistencia</span>
                  </div>
                  <div className="p-5 flex flex-col items-center gap-4">
                    <p className="text-xs text-gray-500 text-center">
                      Dáselo al artista cuando llegue para confirmar el servicio al instante
                    </p>
                    <div className="flex gap-2">
                      {((booking as any).attendanceCode as string).split('').map((digit: string, i: number) => (
                        <span
                          key={i}
                          className="w-10 h-12 flex items-center justify-center bg-gray-900 text-white text-xl font-mono font-bold rounded-xl shadow"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText((booking as any).attendanceCode);
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar código
                    </button>
                  </div>
                </div>
              )}

              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-4 flex items-center justify-between gap-3 ${booking.status === 'completed' ? 'bg-blue-600' : 'bg-[#FF6B35]'}`}>
                  <span className="text-white font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Resumen del Evento
                  </span>
                </div>
                
                <div className="p-5 space-y-5">
                  
                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Fecha Programada</p>
                    <p className="font-semibold text-gray-900 capitalize">{formattedDate}</p>
                    <p className="text-sm text-[#FF6B35] font-medium mt-0.5">{formattedTime}</p>
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
                      <span className="text-sm font-medium text-gray-900">${priceVal.toLocaleString('en-US')}</span>
                    </div>
                    {/* Si hubiera traslados o fees se listarían aquí filtrando metadata */}
                    
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total Pagado</span>
                      <span className="text-lg font-black text-[#FF6B35]">${priceVal.toLocaleString('en-US')}</span>
                    </div>
                  </div>

                </div>

                {/* Acciones del Dashboard Widget */}
                <div className="bg-gray-50 p-5 px-5 flex flex-col gap-3">
                   {canRequestReschedule && (
                     <button
                       onClick={() => setIsModifyDateOpen(true)}
                       className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
                     >
                       <CalendarIcon className="h-4 w-4" />
                       Cambiar Fecha
                     </button>
                   )}
                   {hasPendingReschedule && (
                     <div className="w-full py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
                       <LucideClock size={15} /> Solicitud de cambio de fecha en proceso
                     </div>
                   )}
                   {canReview && (
                     <button
                       onClick={() => setIsReviewModalOpen(true)}
                       className="w-full py-2.5 bg-white border border-[#FF6B35] text-[#FF6B35] font-semibold rounded-xl text-sm hover:bg-orange-50 transition"
                     >
                       Dejar Reseña del Servicio
                     </button>
                   )}
                   {(reviewed || booking.reviewId) && (
                     <div className="w-full py-2.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
                       <LucideCheckCircle size={15} /> Reseña enviada
                     </div>
                   )}
                   {canAddToEvent && (
                     <Link
                       href="/events"
                       className="block w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm text-center hover:bg-gray-50 transition"
                     >
                       Agregar a un Evento
                     </Link>
                   )}
                   {booking.eventId && (
                     <Link
                       href={`/events/${booking.eventId}`}
                       className="block w-full py-2.5 bg-orange-50 border border-[#FF6B35]/30 text-[#FF6B35] font-semibold rounded-xl text-sm text-center hover:bg-orange-100 transition"
                     >
                       Ver Evento asociado
                     </Link>
                   )}
                   {booking.paymentStatus?.toLowerCase() === 'anticipo_paid' && (() => {
                     const anticipo  = Number(booking.anticipoAmount ?? 0);
                     const paid      = Number((booking as any).paidAmount ?? anticipo);
                     const remaining = Number(booking.totalPrice) - paid;
                     if (remaining <= 0) return null;
                     const fmt = (cents: number) =>
                       new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency ?? 'USD' }).format(cents / 100);
                     return (
                       <button
                         onClick={handlePayRemaining}
                         disabled={payingRemaining}
                         className="w-full py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm hover:bg-[#e55f00] transition disabled:opacity-60 flex items-center justify-center gap-2"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                         </svg>
                         {payingRemaining ? 'Iniciando pago…' : `Pagar saldo restante (${fmt(remaining)})`}
                       </button>
                     );
                   })()}
                   {(() => {
                     const sb = (booking as any).sonidistaBooking;
                     if (!sb) return null;
                     const sbStatus = sb.status?.toUpperCase();
                     const sbPayment = sb.paymentStatus?.toUpperCase();
                     if (sbStatus === 'CONFIRMED' && sbPayment === 'PENDING') {
                       const fmt = (cents: number) =>
                         new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency ?? 'USD' }).format(cents / 100);
                       return (
                         <button
                           onClick={handleSonidistaCheckout}
                           disabled={payingSonidista}
                           className="w-full py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl text-sm hover:bg-[#e55f00] transition disabled:opacity-60 flex items-center justify-center gap-2"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                           </svg>
                           {payingSonidista ? 'Iniciando pago…' : `Pagar sonidista (${fmt(Number(sb.totalPrice))})`}
                         </button>
                       );
                     }
                     if (sbStatus === 'CONFIRMED' && sbPayment === 'CARD_AUTHORIZED') {
                       return (
                         <div className="w-full py-2.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl text-sm text-center">
                           Sonidista — pago reservado
                         </div>
                       );
                     }
                     if (sbStatus === 'PENDING') {
                       return (
                         <div className="w-full py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 font-medium rounded-xl text-sm text-center">
                           Sonidista — solicitud enviada, esperando respuesta
                         </div>
                       );
                     }
                     if (sbStatus === 'REJECTED') {
                       return (
                         <div className="w-full py-2 bg-red-50 border border-red-200 text-red-600 font-medium rounded-xl text-sm text-center">
                           Sonidista no disponible para esta fecha
                         </div>
                       );
                     }
                     return null;
                   })()}
                   {canReportNoShow && (
                     <button
                       onClick={() => setNoShowModalOpen(true)}
                       className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl text-sm hover:bg-red-100 transition"
                     >
                       Reportar No-Show
                     </button>
                   )}
                   {(noShowDone || booking.status?.toUpperCase() === 'NO_SHOW') && (
                     <div className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl text-sm text-center">
                       No-show reportado — en revisión
                     </div>
                   )}
                   <button
                     onClick={() => generateBookingReceipt({
                       bookingId: booking.id,
                       bookingCode: booking.code || booking.id.slice(0, 8).toUpperCase(),
                       status: booking.status,
                       serviceName: service?.name || booking.serviceName || 'Servicio',
                       artistName: artist?.nombre || booking.artistName || 'Artista',
                       clientName: userName,
                       clientEmail: user?.email,
                       scheduledDate: booking.scheduledDate || booking.startAt,
                       durationMinutes: booking.durationMinutes,
                       location: booking.location,
                       totalPrice: Number(booking.totalPrice || booking.amount || 0),
                       anticipoAmount: booking.anticipoAmount ? Number(booking.anticipoAmount) : undefined,
                       currency: booking.currency,
                     })}
                     className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Descargar Recibo (PDF)
                   </button>
                   <Link href={`/services/${booking.serviceId || '1'}`} className="text-center text-xs text-gray-500 hover:text-[#FF6B35] transition pt-1">
                     Agendar una nueva cita similar
                   </Link>
                </div>
              </div>

              {/* Participantes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Participantes
                </h3>
                <div className="space-y-3">
                  {/* Cliente (yo) */}
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-orange-200 shrink-0">
                      {user?.avatar ? (
                        <img src={cImg(user.avatar)} alt={userName} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-orange-700">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">Cliente</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      {user?.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                    </div>
                  </div>

                  {/* Artista */}
                  {artist && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-purple-200 shrink-0">
                        {artist.avatar ? (
                          <img src={cImg(artist.avatar)} alt={artist.nombre} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-purple-700">
                            {artist.nombre?.charAt(0).toUpperCase() ?? 'A'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">Artista</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{artist.nombre}</p>
                        {artist.category && <p className="text-xs text-gray-400 truncate">{formatArtistCategory(artist.category, artist.specialties)}</p>}
                      </div>
                    </div>
                  )}
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

      {noShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Reportar No-Show</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  El artista no se presentó al evento. Una vez reportado, el equipo de Piums procesará el reembolso y crédito de compensación.
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
              El artista tendrá 24h para responder antes de que se ejecuten las acciones automáticas.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo (opcional)</label>
              <textarea
                rows={3}
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value.slice(0, 300))}
                placeholder="Describe brevemente lo que ocurrió..."
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition placeholder:text-gray-300"
              />
              <p className="text-right text-xs text-gray-300 mt-1">{noShowReason.length}/300</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setNoShowModalOpen(false)}
                disabled={noShowSubmitting}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleReportNoShow}
                disabled={noShowSubmitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                {noShowSubmitting ? (
                  <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</>
                ) : 'Confirmar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        artistName={artist?.nombre || booking.artistName || 'el Artista'}
        bookingCode={booking.code || booking.id.substring(0, 8).toUpperCase()}
        onSubmit={handleReviewSubmit}
      />

      <ModifyDateModal
        isOpen={isModifyDateOpen}
        onClose={() => setIsModifyDateOpen(false)}
        bookingId={booking.id}
        bookingCode={booking.code || booking.id.substring(0, 8).toUpperCase()}
        currentDate={booking.scheduledDate || booking.startAt || new Date().toISOString()}
        onRequested={() => setRescheduleRequestSent(true)}
      />
    </div>
  );
}
