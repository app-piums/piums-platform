'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { CalendarPicker } from '@/components/booking/CalendarPicker';
import { PricingBreakdown } from '@/components/booking/PricingBreakdown';
import { ConfirmModal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { sdk } from '@piums/sdk';
import type { ArtistProfile, Service, TimeSlot } from '@piums/sdk';
import { getMockArtist, getMockServices, getMockAvailability } from '@/lib/mockData';

type BookingStep = 'service' | 'datetime' | 'details' | 'review';

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
}

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
  const [addons, setAddons] = useState<Addon[]>([]);
  
  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [availability, setAvailability] = useState<Array<{ date: string; slots: Array<{ time: string; available: boolean; price?: number }> }>>([]);
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/booking' + (artistId ? `?artistId=${artistId}` : ''));
    }
  }, [authLoading, isAuthenticated, router, artistId]);

  const loadBookingData = useCallback(async () => {
    try {
      setLoading(true);

      let artistData: ArtistProfile | null = null;
      let servicesData: Service[] = [];

      try {
        artistData = await sdk.getArtist(artistId!);
        servicesData = await sdk.getArtistServices(artistId!);
      } catch {
        artistData = getMockArtist(artistId!);
        servicesData = getMockServices(artistId!);
      }

      if (!artistData) {
        setLoading(false);
        return;
      }

      setArtist(artistData);
      setServices(servicesData);
      setAvailability(getMockAvailability(artistId!));

      // Mock addons
      setAddons([
        { id: '1', name: 'Edición Premium', description: 'Retoque avanzado de todas las fotos', price: 2000 },
        { id: '2', name: 'Entrega Express', description: 'Entrega en 48 horas', price: 1500 },
        { id: '3', name: 'Video Resumen', description: 'Video de 3-5 minutos con highlights', price: 3000 },
      ]);

      if (serviceId) {
        const service = servicesData.find(s => s.id === serviceId);
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
  }, [artistId, serviceId]);

  useEffect(() => {
    if (isAuthenticated && artistId) {
      loadBookingData();
    }
  }, [isAuthenticated, artistId, loadBookingData]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setSelectedTimeSlot(undefined);
    // Availability is already pre-loaded from mock
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      // Build a synthetic TimeSlot from the selected time
      const [h, m] = time.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + (selectedService?.duration ?? 120) * 60000);
      const timeSlot: TimeSlot = {
        time,
        available: true,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
      setSelectedTimeSlot(timeSlot);
    }
  };

  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime && selectedTimeSlot) {
      setStep('details');
    }
  };

  const handleDetailsNext = () => {
    if (location) {
      setStep('review');
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !artist || !user || !selectedTimeSlot) return;

    try {
      setSubmitting(true);
      // Mock booking creation — skip real API
      const mockBookingId = `booking-${Date.now()}`;
      setShowConfirmModal(false);
      router.push(`/booking/confirmation/${mockBookingId}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setShowConfirmModal(false);
      const message = error instanceof Error ? error.message : 'Error al crear la reserva. Por favor intenta de nuevo.';
      alert(message);
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

  const steps = [
    { key: 'service' as BookingStep, label: 'Servicio' },
    { key: 'datetime' as BookingStep, label: 'Fecha' },
    { key: 'details' as BookingStep, label: 'Detalles' },
    { key: 'review' as BookingStep, label: 'Revisar' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Artistas', href: '/artists' },
            { label: artist.nombre, href: `/artists/${artist.id}` },
            { label: 'Nueva Reserva' }
          ]}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Reserva</h1>
        <p className="text-gray-600 mb-8">Completa los siguientes pasos para confirmar tu reserva</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                {steps.map((s, idx) => (
                  <React.Fragment key={s.key}>
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                        step === s.key 
                          ? 'bg-[#FF6A00] text-white ring-4 ring-[#FF6A00]/20' 
                          : idx < currentStepIndex 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {idx < currentStepIndex ? (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`ml-2 text-sm font-medium hidden sm:block transition-colors ${
                        step === s.key ? 'text-[#FF6A00]' : 'text-gray-700'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${
                        idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
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
                      {services.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios disponibles</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Este artista aún no ha publicado servicios.
                          </p>
                          <Button onClick={() => router.push('/artists')} className="mt-6" variant="outline">
                            Buscar otros artistas
                          </Button>
                        </div>
                      ) : (
                        services.map((service) => (
                          <div
                            key={service.id}
                            className={`group p-6 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedService?.id === service.id
                                ? 'border-[#FF6A00] bg-[#FF6A00]/5 shadow-md'
                                : 'border-gray-200 hover:border-[#FF6A00]/50 hover:shadow-sm'
                            }`}
                            onClick={() => handleServiceSelect(service)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {service.name}
                                  </h3>
                                  {selectedService?.id === service.id && (
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#FF6A00] flex items-center justify-center">
                                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {Math.floor(service.duration / 60)} horas
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-2xl font-bold text-[#FF6A00]">
                                  ${service.basePrice.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">GTQ</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* Date & Time */}
                {step === 'datetime' && selectedService && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <CardTitle>Selecciona Fecha y Hora</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Elige una fecha y horario disponible para tu {selectedService.name}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <CalendarPicker
                        availability={availability}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onDateSelect={handleDateSelect}
                        onTimeSelect={handleTimeSelect}
                        minDate={new Date()}
                      />

                      {/* Navigation Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep('service')} fullWidth>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Atrás
                        </Button>
                        <Button
                          onClick={handleDateTimeNext}
                          disabled={!selectedDate || !selectedTime || !selectedTimeSlot}
                          fullWidth
                        >
                          Continuar
                          <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Details */}
                {step === 'details' && (
                  <>
                    <CardTitle className="mb-6">Detalles del Evento</CardTitle>
                    <div className="space-y-6">
                      {/* Ubicación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ubicación del Evento *
                        </label>
                        <Input
                          placeholder="Dirección completa del evento"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Proporciona la dirección exacta donde se realizará el servicio
                        </p>
                      </div>

                      {/* Addons */}
                      {addons.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Extras Opcionales
                          </label>
                          <div className="space-y-3">
                            {addons.map((addon) => (
                              <div
                                key={addon.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  selectedAddons.includes(addon.id)
                                    ? 'border-[#00AEEF] bg-[#00AEEF]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => toggleAddon(addon.id)}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedAddons.includes(addon.id)}
                                      onChange={() => {}}
                                      className="h-4 w-4 text-[#00AEEF] focus:ring-[#00AEEF] border-gray-300 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <p className="font-medium text-gray-900">{addon.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p className="font-semibold text-[#00AEEF]">
                                      +${addon.price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas Adicionales (Opcional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] transition-colors"
                          rows={4}
                          placeholder="Información adicional sobre el evento, preferencias especiales, etc."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Comparte cualquier detalle importante que el artista deba saber
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep('datetime')} fullWidth>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Atrás
                        </Button>
                        <Button
                          onClick={handleDetailsNext}
                          disabled={!location}
                          fullWidth
                        >
                          Revisar Reserva
                          <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Review */}
                {step === 'review' && selectedService && selectedDate && selectedTime && (
                  <>
                    <CardTitle className="mb-6">Revisar y Confirmar</CardTitle>
                    <div className="space-y-6">
                      {/* Artista */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Avatar src={artist.avatar} fallback={artist.nombre} size="lg" />
                        <div>
                          <p className="font-semibold text-gray-900">{artist.nombre}</p>
                          <p className="text-sm text-gray-600">{artist.category}</p>
                          {artist.rating && (
                            <div className="flex items-center mt-1">
                              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-1 text-sm font-medium text-gray-700">{artist.rating.toFixed(1)}</span>
                              <span className="ml-1 text-sm text-gray-500">({artist.reviewsCount} reseñas)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detalles de la Reserva */}
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="font-medium text-gray-900 mb-4">Detalles de la Reserva</h3>
                        <dl className="space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Servicio:</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedService.name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Fecha:</dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {selectedDate.toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Hora:</dt>
                            <dd className="text-sm font-medium text-gray-900">{selectedTime}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Duración:</dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {Math.floor(selectedService.duration / 60)} horas
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Ubicación:</dt>
                            <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">
                              {location}
                            </dd>
                          </div>
                          {notes && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Notas:</dt>
                              <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">
                                {notes}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Política de Cancelación */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-yellow-800 mb-1">
                              Política de Cancelación
                            </h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              <li>• Cancelación gratuita hasta 48 horas antes</li>
                              <li>• Cargo del 25% entre 24-48 horas antes</li>
                              <li>• Sin reembolso con menos de 24 horas</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep('details')} fullWidth>
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Atrás
                        </Button>
                        <Button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={submitting}
                          fullWidth
                        >
                          {submitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Procesando...
                            </>
                          ) : (
                            <>
                              Confirmar Reserva
                              <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Pricing Summary */}
          <div>
            <div className="sticky top-8 space-y-6">
              <PricingBreakdown
                items={[
                  ...(selectedService ? [{
                    id: 'service',
                    label: selectedService.name,
                    amount: selectedService.basePrice,
                    type: 'base' as const,
                  }] : []),
                  ...addons
                    .filter(a => selectedAddons.includes(a.id))
                    .map(addon => ({
                      id: addon.id,
                      label: addon.name,
                      amount: addon.price,
                      type: 'addon' as const,
                      description: addon.description,
                    })),
                ]}
                currency="GTQ"
              />

              {/* Quick Info */}
              <Card>
                <CardContent>
                  <h3 className="font-medium text-gray-900 mb-3">Información Importante</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmación instantánea
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Comunicación directa con el artista
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cancelación gratuita (48h antes)
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Soporte 24/7
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        title="Confirmar Reserva"
        message={
          selectedService && selectedDate && selectedTime
            ? `¿Confirmas la reserva de "${selectedService.name}" con ${artist.nombre} el ${selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${selectedTime}?`
            : '¿Estás seguro de que deseas crear esta reserva?'
        }
        confirmLabel={submitting ? "Creando..." : "Sí, confirmar"}
        cancelLabel="Cancelar"
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
