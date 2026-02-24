'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/DatePicker';
import { TimeSlots } from '@/components/TimeSlots';
import { Modal, ConfirmModal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { Artist, ArtistProfile, Service, TimeSlot } from '@piums/sdk';

type BookingStep = 'service' | 'datetime' | 'details' | 'payment' | 'confirmation';

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const artistId = searchParams.get('artistId');
  const serviceId = searchParams.get('serviceId');
  
  const [step, setStep] = useState<BookingStep>('service');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  
  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/booking' + (artistId ? `?artistId=${artistId}` : ''));
    }
  }, [authLoading, isAuthenticated, router, artistId]);

  useEffect(() => {
    if (isAuthenticated && artistId) {
      loadBookingData();
    }
  }, [isAuthenticated, artistId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      
      // Mock data
      const mockArtist: ArtistProfile = {
        id: artistId!,
        nombre: 'María García',
        imagenPerfil: '',
        categoria: 'Fotografía',
        ciudad: 'Ciudad de México',
        rating: 4.8,
        reviewsCount: 47,
        bookingsCount: 156,
        isVerified: true,
        isActive: true,
        isPremium: true,
        createdAt: new Date().toISOString(),
      };

      const mockServices: Service[] = [
        {
          id: '1',
          artistId: artistId!,
          name: 'Cobertura de Boda Completa',
          description: 'Incluye cobertura de 8 horas, entrega de 300+ fotos editadas, álbum digital',
          basePrice: 15000,
          duration: 480,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          artistId: artistId!,
          name: 'Sesión de XV Años',
          description: 'Cobertura de 6 horas, 200+ fotos editadas, álbum digital',
          basePrice: 10000,
          duration: 360,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          artistId: artistId!,
          name: 'Evento Corporativo',
          description: 'Cobertura de 4 horas, 150+ fotos editadas',
          basePrice: 8000,
          duration: 240,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      setArtist(mockArtist);
      setServices(mockServices);
      
      // Auto-select service if provided in URL
      if (serviceId) {
        const service = mockServices.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setStep('datetime');
        }
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime && selectedTimeSlot) {
      setStep('details');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setSelectedTimeSlot(undefined);
  };

  const handleTimeSelect = (time: string, slot: TimeSlot) => {
    setSelectedTime(time);
    setSelectedTimeSlot(slot);
  };

  const handleDetailsNext = () => {
    if (location) {
      // Mostrar modal de confirmación antes de continuar
      setShowConfirmModal(true);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !artist || !user || !selectedTimeSlot) return;
    
    try {
      setSubmitting(true);
      
      // Calcular fecha/hora de fin basado en duración del servicio
      const endTime = new Date(new Date(selectedTimeSlot.startTime).getTime() + selectedService.duration * 60000);
      
      // Validar disponibilidad antes de crear la reserva
      const availabilityCheck = await sdk.checkAvailability(
        artist.id,
        selectedTimeSlot.startTime,
        endTime.toISOString()
      );
      
      if (availabilityCheck.hasReservation) {
        setShowConfirmModal(false);
        setSubmitting(false);
        alert('Lo sentimos, este horario ya no está disponible. Por favor selecciona otro horario.');
        // Volver al paso de fecha/hora para que el usuario seleccione otro slot
        setStep('datetime');
        setSelectedTime(undefined);
        setSelectedTimeSlot(undefined);
        return;
      }
      
      // Preparar payload
      const payload = {
        clientId: user.id,
        artistId: artist.id,
        serviceId: selectedService.id,
        scheduledDate: selectedTimeSlot.startTime,
        durationMinutes: selectedService.duration,
        location,
        clientNotes: notes,
      };
      
      // Crear booking usando SDK
      const booking = await sdk.createBooking(payload);
      
      // Cerrar modal
      setShowConfirmModal(false);
      
      // Redirigir a página de confirmación
      router.push(`/booking/confirmation/${booking.id}`);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setShowConfirmModal(false);
      alert(error.message || 'Error al crear la reserva. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
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

  if (!artist || !artistId) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Información de reserva no válida</h2>
          <Button onClick={() => router.push('/artists')} className="mt-4">
            Ver Artistas
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Artistas', href: '/artists' },
            { label: 'Nueva Reserva' }
          ]}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nueva Reserva</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {(['service', 'datetime', 'details', 'payment'] as BookingStep[]).map((s, idx) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        step === s ? 'bg-blue-600 text-white' : 
                        idx < ['service', 'datetime', 'details', 'payment'].indexOf(step) ? 'bg-green-500 text-white' : 
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {idx < ['service', 'datetime', 'details', 'payment'].indexOf(step) ? (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                        {s === 'service' && 'Servicio'}
                        {s === 'datetime' && 'Fecha'}
                        {s === 'details' && 'Detalles'}
                        {s === 'payment' && 'Pago'}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        idx < ['service', 'datetime', 'details', 'payment'].indexOf(step) ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Card>
              <CardContent>
                {/* Service Selection */}
                {step === 'service' && (
                  <>
                    <CardTitle className="mb-4">Selecciona un Servicio</CardTitle>
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedService?.id === service.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              <p className="text-sm text-gray-500 mt-2">
                                Duración: {Math.floor(service.duration / 60)} horas
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-blue-600">
                                ${service.basePrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Date & Time */}
                {step === 'datetime' && (
                  <>
                    <CardTitle className="mb-4">Selecciona Fecha y Hora</CardTitle>
                    <div className="space-y-6">
                      {/* Date Picker */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">1. Elige una fecha disponible</h3>
                        {artistId && (
                          <DatePicker
                            artistId={artistId}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            minDate={new Date()}
                          />
                        )}
                      </div>

                      {/* Time Slots */}
                      {selectedDate && artistId && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">2. Elige un horario</h3>
                          <TimeSlots
                            artistId={artistId}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onTimeSelect={handleTimeSelect}
                          />
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep('service')} fullWidth>
                          Atrás
                        </Button>
                        <Button
                          onClick={handleDateTimeNext}
                          disabled={!selectedDate || !selectedTime || !selectedTimeSlot}
                          fullWidth
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Details */}
                {step === 'details' && (
                  <>
                    <CardTitle className="mb-4">Detalles del Evento</CardTitle>
                    <div className="space-y-4">
                      <Input
                        label="Ubicación del Evento"
                        placeholder="Dirección completa"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas Adicionales (Opcional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="Información adicional sobre el evento..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep('datetime')} fullWidth>
                          Atrás
                        </Button>
                        <Button
                          onClick={handleDetailsNext}
                          disabled={!location}
                          fullWidth
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Payment */}
                {step === 'payment' && (
                  <>
                    <CardTitle className="mb-4">Método de Pago</CardTitle>
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-lg">
                        <p className="font-medium text-gray-900">Pago en Efectivo</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Pagarás directamente al artista el día del evento
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="ml-3 text-sm text-yellow-700">
                            Asegúrate de confirmar el pago y las condiciones con el artista antes del evento.
                          </p>
                        </div>
                      </div>

                      {/* Política de Cancelación */}
                      <div className="border-t border-gray-200 pt-4">
                        <button
                          onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <h4 className="font-medium text-gray-900">Política de Cancelación</h4>
                          <svg
                            className={`h-5 w-5 text-gray-500 transition-transform ${showCancellationPolicy ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCancellationPolicy && (
                          <div className="mt-3 space-y-2 text-sm text-gray-600">
                            <p>
                              • Puedes cancelar hasta 48 horas antes del evento sin costo.
                            </p>
                            <p>
                              • Cancelaciones entre 24-48 horas tienen un cargo del 25%.
                            </p>
                            <p>
                              • Cancelaciones con menos de 24 horas no son reembolsables.
                            </p>
                            <p>
                              • El artista puede reagendar en caso de emergencia.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep('details')} fullWidth>
                          Atrás
                        </Button>
                        <Button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={submitting}
                          fullWidth
                        >
                          Confirmar Reserva
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div>
            <Card className="sticky top-8">
              <CardTitle className="mb-4">Resumen</CardTitle>
              <CardContent>
                {/* Artist Info */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
                  <Avatar src={artist.imagenPerfil} fallback={artist.nombre} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{artist.nombre}</p>
                    <p className="text-sm text-gray-600">{artist.categoria}</p>
                  </div>
                </div>

                {/* Selected Service */}
                {selectedService && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Servicio</p>
                    <p className="font-medium text-gray-900">{selectedService.name}</p>
                  </div>
                )}

                {/* Selected Date/Time */}
                {selectedDate && selectedTime && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Fecha y Hora</p>
                    <p className="font-medium text-gray-900">
                      {selectedDate.toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedTime}
                    </p>
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Ubicación</p>
                    <p className="font-medium text-gray-900">{location}</p>
                  </div>
                )}

                {/* Total */}
                {selectedService && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-gray-900">Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedService.basePrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        title="Confirmar Reserva"
        message={
          selectedService && selectedDate && selectedTime
            ? `¿Confirmas la reserva de "${selectedService.name}" con ${artist.nombre} el ${selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${selectedTime}?`
            : '¿Estás seguro de que deseas crear esta reserva?'
        }
        confirmLabel="Sí, confirmar"
        cancelLabel="Revisar"
        variant="info"
        isLoading={submitting}
      />

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <BookingContent />
    </Suspense>
  );
}
