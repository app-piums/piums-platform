'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { Booking, Artist, Service } from '@piums/sdk';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/booking/confirmation/' + bookingId);
    }
  }, [authLoading, isAuthenticated, router, bookingId]);

  const loadBookingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar booking
      const bookingData = await sdk.getBooking(bookingId);
      
      if (!bookingData) {
        setError('Reserva no encontrada');
        return;
      }

      setBooking(bookingData);

      // Cargar datos del artista y servicio en paralelo
      const [artistData, servicesData] = await Promise.all([
        sdk.getArtist(bookingData.artistId),
        sdk.getArtistServices(bookingData.artistId),
      ]);

      setArtist(artistData);
      
      // Encontrar el servicio específico
      const serviceData = servicesData.find(s => s.id === bookingData.serviceId);
      setService(serviceData || null);

    } catch (err) {
      console.error('Error loading booking:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar la reserva';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      loadBookingData();
    }
  }, [isAuthenticated, bookingId, loadBookingData]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      PAYMENT_PENDING: { label: 'Pago Pendiente', color: 'bg-orange-100 text-orange-800' },
      PAYMENT_COMPLETED: { label: 'Pagado', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'En Progreso', color: 'bg-indigo-100 text-indigo-800' },
      COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      CANCELLED_CLIENT: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      CANCELLED_ARTIST: { label: 'Cancelada por Artista', color: 'bg-red-100 text-red-800' },
      REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
      NO_SHOW: { label: 'No Show', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleDownloadPDF = () => {
    if (!bookingId) return;
    
    // Abrir PDF en nueva ventana para descarga
    const pdfUrl = `http://localhost:3000/api/booking/bookings/${bookingId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const handleAddToCalendar = (type: 'google' | 'apple') => {
    if (!booking) return;

    const title = `Reserva con ${artist?.nombre || 'Artista'}`;
    const description = `Servicio: ${service?.name || 'N/A'}${booking.location ? `\nUbicación: ${booking.location}` : ''}${booking.clientNotes ? `\nNotas: ${booking.clientNotes}` : ''}`;
    const startDate = new Date(booking.scheduledDate);
    const endDate = new Date(startDate.getTime() + booking.durationMinutes * 60000);

    if (type === 'google') {
      const startStr = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(booking.location || '')}`;
      window.open(url, '_blank');
    } else if (type === 'apple') {
      // ICS file format
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/-|:|\.\d\d\d/g, '')}
DTEND:${endDate.toISOString().replace(/-|:|\.\d\d\d/g, '')}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${booking.location || ''}
END:VEVENT
END:VCALENDAR`;
      
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reserva-${booking.code || booking.id}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    if (!booking) return;

    const shareData = {
      title: `Reserva ${booking.code || booking.id}`,
      text: `Mi reserva con ${artist?.nombre || 'Artista'} - ${formatDate(booking.scheduledDate)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado al portapapeles');
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <Navbar />
        <Loading />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {error || 'Reserva no encontrada'}
              </h2>
              <p className="text-gray-600 mb-6">
                No pudimos cargar los detalles de tu reserva.
              </p>
              <Button onClick={() => router.push('/bookings')}>
                Ver Mis Reservas
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Reservas', href: '/bookings' },
            { label: 'Confirmación' }
          ]}
          className="mb-6"
        />

        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Reserva Confirmada!
            </h1>
            <p className="text-gray-600 mb-4">
              Tu reserva ha sido creada exitosamente. Hemos enviado los detalles a tu correo.
            </p>
            {booking.code && (
              <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Código de Reserva</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">{booking.code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artist & Service Info */}
            <Card>
              <CardTitle>Detalles del Servicio</CardTitle>
              <CardContent>
                {/* Artist */}
                {artist && (
                  <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                    <Avatar src={artist.imagenPerfil} fallback={artist.nombre} size="lg" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{artist.nombre}</h3>
                      <p className="text-sm text-gray-600">{artist.categoria}</p>
                      {artist.rating && (
                        <div className="flex items-center mt-1">
                          <svg className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-700">{artist.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Service */}
                {service && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date, Time, Location */}
            <Card>
              <CardTitle>Información del Evento</CardTitle>
              <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(booking.scheduledDate)}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(booking.scheduledDate)} · {Math.floor(booking.durationMinutes / 60)} hora{booking.durationMinutes >= 120 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {booking.location && (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600">{booking.location}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {booking.clientNotes && (
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Notas</p>
                      <p className="text-sm text-gray-600">{booking.clientNotes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardTitle>Acciones</CardTitle>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleDownloadPDF} fullWidth>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar PDF
                  </Button>

                  <Button variant="outline" onClick={() => handleAddToCalendar('google')} fullWidth>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Google Calendar
                  </Button>

                  <Button variant="outline" onClick={() => handleAddToCalendar('apple')} fullWidth>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Apple Calendar
                  </Button>

                  <Button variant="outline" onClick={handleShare} fullWidth>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Compartir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardTitle>Estado</CardTitle>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Estado de la Reserva</p>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Estado del Pago</p>
                    {getStatusBadge(booking.paymentStatus)}
                  </div>

                  {booking.createdAt && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Creada el {new Date(booking.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card>
              <CardTitle>Resumen de Pago</CardTitle>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Servicio</span>
                    <span className="font-medium text-gray-900">
                      ${(booking.servicePrice / 100).toLocaleString()} {booking.currency}
                    </span>
                  </div>

                  {booking.addonsPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extras</span>
                      <span className="font-medium text-gray-900">
                        ${(booking.addonsPrice / 100).toLocaleString()} {booking.currency}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-gray-900">
                        ${(booking.totalPrice / 100).toLocaleString()} {booking.currency}
                      </span>
                    </div>
                  </div>

                  {booking.depositRequired && booking.depositAmount && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Depósito requerido</span>
                        <span className="font-medium text-orange-600">
                          ${(booking.depositAmount / 100).toLocaleString()} {booking.currency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardTitle>Próximos Pasos</CardTitle>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">1</span>
                    <span className="text-gray-700">Revisa tu correo para confirmar los detalles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">2</span>
                    <span className="text-gray-700">El artista confirmará tu reserva pronto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-3">3</span>
                    <span className="text-gray-700">Recibirás recordatorios antes del evento</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              <Button onClick={() => router.push('/bookings')} fullWidth>
                Ver Mis Reservas
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} fullWidth>
                Ir al Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
