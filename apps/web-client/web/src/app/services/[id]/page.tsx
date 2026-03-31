'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { sdk, type ArtistProfile, type Service } from '@piums/sdk';
import { toast } from '@/lib/toast';

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_SERVICE = {
  id: '1',
  title: 'Creación de Mural en Vivo: Esencia Latina',
  category: 'Pintura Mural',
  popular: true,
  artistName: 'Alma Acevedo',
  artistTag: 'Experta en Economía Naranja',
  artistAvatar: '',
  rating: 4.9,
  ratingCount: 50,
  duration: '4–6 Horas',
  maxCapacity: 50,
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  ],
  description:
    'Este servicio de Pintura Mural en Vivo está diseñado para transformar espacios comerciales y convertirlos en obras de arte con una experiencia netamente latina. Este servicio forma parte de la Economía Naranja, buscamos visibilizar el arte como motor de crecimiento y valor.',
  mision:
    '"Transformamos espacios a través del arte creativo, abriendo oportunidades económicas al estilo de una plataforma que conecta talento con propósito."',
  includes: [
    'Materiales profesionales (primera visita)',
    'Boceto digital previo',
    'Crédito para economía creativa',
    'Tecnologías de procesos opcionales',
  ],
  resources: [
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Problemas de documentación',   sub: 'Plantillas y formularios' },
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'MVP – Esqueleto Operativo',    sub: 'Procesos internos eficientes' },
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Finanzas Piums',               sub: 'Gestión de facturación' },
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>, label: 'Acuerdo de Legales',           sub: 'Protección intelectual' },
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: 'Modelo de Negocio',             sub: 'Canvas & estructura base' },
    { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Equipo Piums',                  sub: 'Soporte y acompañamiento' },
  ],
  servicePrices: [
    { id: 'a', name: 'Ilustración Personalizada', description: 'Entrega digital en alta resolución. Incluye 2 revisiones.', price: 150000, hasPrice: true },
    { id: 'b', name: 'Consultoría de Arte',        description: 'Sesión de 1 hora por videollamada para asesoría de proyectos.', price: 80000,  hasPrice: true },
    { id: 'c', name: 'Mural (Cotización)',          description: 'Agendar visita técnica para cotizar mural en espacio físico.', price: null,   hasPrice: false },
  ],
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_ABBR    = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

const TIME_SLOTS = ['08:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'];

// Blocked days (just for demo)
const BLOCKED_DAYS = new Set([3, 10, 17, 22, 28]);

type DisplayService = typeof MOCK_SERVICE;

const minutesToLabel = (minutes: number) => {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minutos`;
};

const formatServiceDuration = (service?: Service | null) => {
  if (!service) return MOCK_SERVICE.duration;
  if (service.durationMin && service.durationMax) {
    if (service.durationMin === service.durationMax) {
      return minutesToLabel(service.durationMin);
    }
    return `${minutesToLabel(service.durationMin)} – ${minutesToLabel(service.durationMax)}`;
  }
  if (service.duration) {
    return minutesToLabel(service.duration);
  }
  if (service.durationMin) {
    return minutesToLabel(service.durationMin);
  }
  if (service.durationMax) {
    return minutesToLabel(service.durationMax);
  }
  return 'Duración variable';
};

const normalizeServiceData = (service: Service | null, artist: ArtistProfile | null): DisplayService => {
  if (!service) {
    return MOCK_SERVICE;
  }

  const includes = service.whatIsIncluded && service.whatIsIncluded.length > 0
    ? service.whatIsIncluded
    : MOCK_SERVICE.includes;

  const price = typeof service.basePrice === 'number' ? service.basePrice : null;

  return {
    ...MOCK_SERVICE,
    id: service.id,
    title: service.name || MOCK_SERVICE.title,
    category: artist?.category || service.categoryId || MOCK_SERVICE.category,
    popular: Boolean(service.isAvailable ?? service.status === 'ACTIVE'),
    artistName: artist?.nombre || MOCK_SERVICE.artistName,
    artistTag: artist?.category || MOCK_SERVICE.artistTag,
    artistAvatar: artist?.avatar || MOCK_SERVICE.artistAvatar,
    rating: artist?.rating || MOCK_SERVICE.rating,
    ratingCount: artist?.reviewsCount || MOCK_SERVICE.ratingCount,
    duration: formatServiceDuration(service),
    images: service.images && service.images.length > 0 ? service.images : MOCK_SERVICE.images,
    description: service.description || MOCK_SERVICE.description,
    mision: artist?.bio || MOCK_SERVICE.mision,
    includes,
    servicePrices: [
      {
        id: service.id,
        name: service.name || MOCK_SERVICE.servicePrices[0].name,
        description: service.description || MOCK_SERVICE.servicePrices[0].description,
        price,
        hasPrice: price !== null,
      },
    ],
  } as DisplayService;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCOP(n: number) {
  return 'Q' + (n / 100).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Booking sidebar ─────────────────────────────────────────────────────────
function BookingWidget({
  serviceData,
  artistId,
  serviceId,
}: {
  serviceData: DisplayService;
  artistId?: string;
  serviceId?: string;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSvc,  setSelectedSvc]  = useState(serviceData.servicePrices[0]?.id ?? serviceData.id);

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 0) % 7; // 0=Sun
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1); } else setMonth(m => m + 1); };

  const fallbackOption = {
    id: serviceData.id,
    name: serviceData.title,
    description: serviceData.description,
    price: null,
    hasPrice: false,
  };

  const chosenService = serviceData.servicePrices.find(s => s.id === selectedSvc) ?? fallbackOption;
  const bookingServiceTarget = serviceId ?? selectedSvc;
  const canProceed = Boolean(selectedDay && selectedTime && artistId && bookingServiceTarget);

  const handleContinue = () => {
    const targetArtistId = artistId;
    const targetServiceId = bookingServiceTarget;
    if (!targetArtistId || !targetServiceId) {
      toast.error('No pudimos preparar la reserva. Por favor intenta de nuevo.');
      return;
    }

    const bookingUrl = `/booking?artistId=${encodeURIComponent(targetArtistId)}&serviceId=${encodeURIComponent(targetServiceId)}`;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(bookingUrl)}`);
      return;
    }

    router.push(bookingUrl);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="bg-[#FF6A00] px-5 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <CalendarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Reservar Servicio</p>
          <p className="text-white/75 text-xs">Paso 1 de 3: Selección</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* 1. Select service */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            1 &nbsp; Selecciona un servicio
          </p>
          <div className="space-y-2">
            {serviceData.servicePrices.map(svc => {
              const active = selectedSvc === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => setSelectedSvc(svc.id)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                    active
                      ? 'border-[#FF6A00] bg-orange-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${active ? 'text-[#FF6A00]' : 'text-gray-900'}`}>
                        {svc.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{svc.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span className={`text-sm font-bold ${svc.hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>
                        {svc.hasPrice ? formatCOP(svc.price!) : '– –'}
                      </span>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        active ? 'border-[#FF6A00]' : 'border-gray-300'
                      }`}>
                        {active && <div className="h-2 w-2 rounded-full bg-[#FF6A00]" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Date & time */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            2 &nbsp; Fecha y Hora
          </p>

          {/* Calendar */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTH_NAMES[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_ABBR.map((d, i) => (
                <div key={i} className="text-center text-[10px] text-gray-400 font-medium">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isToday   = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const isBlocked = BLOCKED_DAYS.has(day);
                const isSelected = day === selectedDay;
                const isPast    = new Date(year, month, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return (
                  <button
                    key={i}
                    disabled={isBlocked || isPast}
                    onClick={() => setSelectedDay(day)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all
                      ${isSelected  ? 'bg-[#FF6A00] text-white shadow-md shadow-orange-200'   : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-[#FF6A00] text-[#FF6A00] font-bold' : ''}
                      ${isBlocked || isPast ? 'text-gray-300 cursor-not-allowed' : !isSelected ? 'text-gray-700 hover:bg-gray-200' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedTime === t
                    ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-[#FF6A00] hover:text-[#FF6A00]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total a pagar</span>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900">
                {chosenService.hasPrice ? formatCOP(chosenService.price!) : 'Cotización'}
              </span>
              {chosenService.hasPrice && (
                <span className="block text-xs text-gray-400 ml-1">COP</span>
              )}
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canProceed}
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            Continuar al Pago
            <ArrowRightIcon className="h-4 w-4" />
          </button>

          <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
            <LockIcon className="h-3 w-3" />
            Pagos seguros y protegidos por Piums
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing breakdown card (first image right panel) ─────────────────────────
function PricingCard({ serviceData }: { serviceData: DisplayService }) {
  const mainOption = serviceData.servicePrices[0];
  const hasLivePrice = typeof mainOption?.price === 'number';
  const basePriceValue = hasLivePrice ? mainOption!.price! : 220000;
  const artistFeeValue = Math.round(basePriceValue * 0.15);
  const totalValue = basePriceValue + artistFeeValue;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {hasLivePrice ? formatCOP(basePriceValue) : 'Cotización'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasLivePrice ? 'por sesión' : 'Solicita una cotización personalizada'}
          </p>
        </div>
        <span className="px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">Experto</span>
      </div>

      {/* Mini week row */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Selecciona fecha</p>
        <div className="flex gap-1">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${i === 0 ? 'bg-[#FF6A00] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              <span className="font-medium">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Times */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Horario</p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-lg border-2 border-gray-100 text-xs font-medium text-gray-600 hover:border-gray-200">
            09:00 AM
          </button>
          <button className="flex-1 py-2 rounded-lg border-2 border-[#FF6A00] bg-orange-50 text-xs font-semibold text-[#FF6A00]">
            10:30 AM
          </button>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Tarifa base</span>
          <span className="font-medium">{formatCOP(basePriceValue)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tarifa Hora de Artista</span>
          <span className="font-medium">{formatCOP(artistFeeValue)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-[#FF6A00]">
          <span>Total</span>
          <span>{formatCOP(totalValue)}</span>
        </div>
      </div>

      <button className="w-full py-3.5 bg-[#FF6A00] hover:bg-orange-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
        Agendar Ahora
        <ArrowRightIcon className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
        <LockIcon className="h-3.5 w-3.5" />
        <span>Pago Seguro · Protegido por Piums</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ServiceDetailPage() {
  const params = useParams<{ id?: string }>();
  const routeServiceId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [showBooking, setShowBooking] = useState(false);
  const [serviceData, setServiceData] = useState<Service | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchService = async () => {
      if (!routeServiceId) {
        setError('No encontramos este servicio.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`DEBUG: Fetching service with ID: ${routeServiceId}`);
        const data = await sdk.getService(routeServiceId);
        console.log('DEBUG: getService response:', data);

        if (!isMounted) return;

        if (!data) {
          if (routeServiceId === '1') {
            // Fallback para demo
            setServiceData({ 
              id: '1', 
              name: MOCK_SERVICE.title, 
              description: MOCK_SERVICE.description,
              artistId: '1' // asumiendo artista demo 1
            } as any);
            return;
          }
          setError('Este servicio no está disponible en este momento.');
          setServiceData(null);
          return;
        }

        setServiceData(data);

        if (data.artistId) {
          const artistProfile = await sdk.getArtist(data.artistId);
          if (isMounted) {
            setArtist(artistProfile);
          }
        } else {
          setArtist(null);
        }
      } catch (err) {
        console.error('Error loading service detail:', err);
        if (isMounted) {
          setError('Ocurrió un problema al cargar este servicio. Intenta nuevamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchService();

    return () => {
      isMounted = false;
    };
  }, [routeServiceId]);

  const service = useMemo(() => normalizeServiceData(serviceData, artist), [serviceData, artist]);
  const bookingArtistId = serviceData?.artistId || artist?.id;
  const bookingServiceId = serviceData?.id;

  const STEPS = ['En sitio', 'Agenda', 'Revisión', 'Confirmación'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!serviceData || error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-xl font-semibold text-gray-900 mb-3">
          {error || 'El servicio no está disponible en este momento.'}
        </p>
        <p className="text-gray-600 mb-6">Explora otros artistas para encontrar la experiencia ideal.</p>
        <Link
          href="/artists"
          className="px-6 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20"
        >
          Ver artistas disponibles
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/dashboard" className="shrink-0">
            <Image src="/logo.jpg" alt="PIUMS" width={90} height={30} className="h-7 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link href="/artists"  className="hover:text-gray-900 transition-colors">Explorar Artistas</Link>
            <Link href="/"         className="hover:text-gray-900 transition-colors">Cómo funciona</Link>
            <Link href="/"         className="hover:text-gray-900 transition-colors">Economía Naranja</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              U
            </Link>
          </div>
        </div>

        {/* Progress steps */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const active = i === 1; // "Agenda" step active in service view
              const done   = i === 0;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done   ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                      : active ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                      : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      {done ? <CheckIcon className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${active || done ? 'text-[#FF6A00]' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 ${done ? 'bg-[#FF6A00]' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── LEFT: service detail ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Hero image */}
            <div className="relative w-full aspect-[16/9] lg:aspect-[2/1] rounded-2xl overflow-hidden bg-gray-200">
              <Image
                src={service.images[0]}
                alt={service.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
              {/* Overlay tags */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-[#FF6A00] text-white text-xs font-bold rounded-full uppercase tracking-wide shadow">
                  {service.category}
                </span>
                {service.popular && (
                  <span className="px-3 py-1 bg-white text-gray-800 text-xs font-bold rounded-full uppercase tracking-wide shadow">
                    Popular
                  </span>
                )}
              </div>
            </div>

            {/* Title + artist */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                {service.title}
              </h1>
              <p className="text-sm text-gray-500">
                Por{' '}
                <span className="text-[#FF6A00] font-semibold">{service.artistName}</span>
                {' '}·{' '}
                <span>{service.artistTag}</span>
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <StatPill icon={<ClockIcon className="h-4 w-4 text-gray-400" />} label={service.duration} />
              <StatPill icon={<UsersIcon className="h-4 w-4 text-gray-400" />} label={`Hasta ${service.maxCapacity} pers.`} />
              <StatPill icon={<StarFilledIcon className="h-4 w-4 text-yellow-400" />} label={`${service.rating} / ${service.ratingCount}`} />
            </div>

            {/* Mobile: toggle booking button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowBooking(v => !v)}
                className="w-full py-3 bg-[#FF6A00] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <CalendarIcon className="h-5 w-5" />
                {showBooking ? 'Ver detalles' : 'Reservar servicio'}
              </button>
            </div>

            {/* Mobile booking widget */}
            {showBooking && (
              <div className="lg:hidden">
                <BookingWidget
                  key={`booking-widget-mobile-${service.id}`}
                  serviceData={service}
                  artistId={bookingArtistId}
                  serviceId={bookingServiceId}
                />
              </div>
            )}

            {/* Sobre el servicio */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Sobre el Servicio</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>

              {/* Misión callout */}
              <blockquote className="border-l-4 border-[#FF6A00] bg-orange-50 rounded-r-xl pl-4 pr-4 py-3">
                <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                  <StarFilledIcon className="h-3.5 w-3.5 text-[#FF6A00]" />
                  Nuestra Misión
                </p>
                <p className="text-sm text-orange-900 italic leading-relaxed">{service.mision}</p>
              </blockquote>
            </section>

            {/* ¿Qué incluye? */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">¿Qué incluye?</h2>
              <ul className="space-y-2.5">
                {service.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Recursos y Documentación */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recursos y Documentación</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {service.resources.map((r, i) => (
                  <button
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#FF6A00]/30 hover:bg-orange-50/50 transition-all text-left group"
                  >
                    <span className="text-[#FF6A00] leading-none mt-0.5">{r.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-[#FF6A00] leading-snug">{r.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* ── RIGHT: sticky booking panels ── */}
          <div className="hidden lg:block w-[340px] shrink-0 space-y-4 sticky top-28">

            {/* Pricing summary card */}
            <PricingCard serviceData={service} />

            {/* Full booking widget */}
            <BookingWidget
              key={`booking-widget-desktop-${service.id}`}
              serviceData={service}
              artistId={bookingArtistId}
              serviceId={bookingServiceId}
            />

          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <Image src="/logo.jpg" alt="PIUMS" width={70} height={24} className="h-5 w-auto" />
          <p className="text-xs text-gray-400">
            © 2026 Piums · La plataforma de la Economía Naranja
          </p>
          <div className="flex gap-5 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">Instagram</Link>
            <Link href="/" className="hover:text-gray-900">LinkedIn</Link>
            <Link href="/" className="hover:text-gray-900">Behance</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
      {icon}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
