'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
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
import type { ArtistProfile, Service, TimeSlot, PriceQuote, CalculateServicePricePayload, CouponValidation } from '@piums/sdk';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import { toast } from '@/lib/toast';
import { CurrencyToggle, useCurrency } from '@/contexts/CurrencyContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import {
  Cake, Rings, GraduationCap, Crown, Building2,
  Music, PartyPopper, Baby, Church, Wine, HelpCircle, LucideIcon
} from 'lucide-react';

const EVENT_TYPE_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'CUMPLEANOS',  label: 'Cumpleaños', Icon: Cake },
  { value: 'BODA',        label: 'Boda',       Icon: Rings },
  { value: 'GRADUACION',  label: 'Graduación', Icon: GraduationCap },
  { value: 'QUINCEANERA', label: 'Quinceañera', Icon: Crown },
  { value: 'CORPORATIVO', label: 'Corporativo', Icon: Building2 },
  { value: 'CONCIERTO',   label: 'Concierto',  Icon: Music },
  { value: 'FIESTA',      label: 'Fiesta',     Icon: PartyPopper },
  { value: 'BABY_SHOWER', label: 'Baby Shower', Icon: Baby },
  { value: 'BAUTIZO',     label: 'Bautizo',    Icon: Church },
  { value: 'ANIVERSARIO', label: 'Aniversario', Icon: Wine },
  { value: 'OTRO',        label: 'Otro',       Icon: HelpCircle },
];

type BookingStep = 'service' | 'datetime' | 'details' | 'review';
type DayAvailability = {
  date: string;
  slots: TimeSlot[];
};

type Coordinates = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceKm = (from: Coordinates, to: Coordinates): number => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const DEFAULT_SLOT_TIMES = ['09:00', '11:30', '15:00', '18:30'];
const MARCH_MONTH_INDEX = 2; // 0-based index for March

const getDateKey = (date: Date) => date.toISOString().split('T')[0];

const createTimeSlotForDate = (date: Date, time: string, durationMinutes: number): TimeSlot => {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  return {
    time,
    available: true,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

const buildMarchAvailability = (year: number, durationMinutes: number): DayAvailability[] => {
  const daysInMarch = new Date(year, MARCH_MONTH_INDEX + 1, 0).getDate();
  const entries: DayAvailability[] = [];

  for (let day = 1; day <= daysInMarch; day++) {
    const date = new Date(year, MARCH_MONTH_INDEX, day);
    const dateKey = getDateKey(date);
    const slots = DEFAULT_SLOT_TIMES.map((slot) => createTimeSlotForDate(date, slot, durationMinutes));
    entries.push({ date: dateKey, slots });
  }

  return entries;
};

const isMarchDate = (date: Date) => date.getMonth() === MARCH_MONTH_INDEX;

const buildFallbackQuote = (
  service: Service,
  addonIds: string[],
  coords?: Coordinates | null,
  distanceKm?: number | null
): PriceQuote => {
  const baseCents = service.basePrice ?? 0;
  const selectedAddons = service.addons?.filter((addon) => addonIds.includes(addon.id)) ?? [];
  const addonCents = selectedAddons.reduce((sum, addon) => sum + (addon.price ?? 0), 0);

  const baseItem = {
    type: 'BASE' as const,
    name: service.name || 'Servicio',
    qty: 1,
    unitPriceCents: baseCents,
    totalPriceCents: baseCents,
  };

  const addonItems = selectedAddons.map((addon) => ({
    type: 'ADDON' as const,
    name: addon.name,
    qty: 1,
    unitPriceCents: addon.price ?? 0,
    totalPriceCents: addon.price ?? 0,
    metadata: { addonId: addon.id },
  }));

  const travelItem = {
    type: 'TRAVEL' as const,
    name: 'Costo de traslado',
    qty: 1,
    unitPriceCents: 0,
    totalPriceCents: 0,
    metadata: {
      distanceKm: distanceKm ?? null,
      clientLat: coords?.lat ?? null,
      clientLng: coords?.lng ?? null,
      source: coords ? 'AUTO' : 'MANUAL',
    },
  };

  const items: PriceQuote['items'] = [baseItem, ...addonItems, travelItem];
  const totalCents = baseCents + addonCents + travelItem.totalPriceCents;

  return {
    serviceId: service.id,
    currency: service.currency || 'USD',
    items,
    subtotalCents: totalCents,
    totalCents,
    breakdown: {
      baseCents,
      addonsCents: addonCents,
      travelCents: travelItem.totalPriceCents,
      discountsCents: 0,
    },
  };
};

const getDurationMinutes = (service?: Service | null): number => {
  if (!service) return 60;
  return service.duration ?? service.durationMin ?? service.durationMax ?? 60;
};

const getDurationLabel = (service?: Service | null): string => {
  const minutes = getDurationMinutes(service);
  if (!minutes) return 'Duración variable';
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minutos`;
};

const formatCurrency = (amount: number, currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const centsToUnits = (cents?: number) => (cents ?? 0) / 100;

const getDefaultAddonIds = (service?: Service | null): string[] =>
  service?.addons?.filter((addon) => addon.isRequired || addon.isDefault).map((addon) => addon.id) ?? [];

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const sanitizeParam = (value: string | null) => {
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value;
  };

  const artistId = sanitizeParam(searchParams.get('artistId'));
  const serviceId = sanitizeParam(searchParams.get('serviceId'));
  const eventId = sanitizeParam(searchParams.get('eventId'));
  const [resolvedArtistId, setResolvedArtistId] = useState<string | null>(artistId);

  // Funnel tracking session
  const [sessionId] = useState(() => crypto.randomUUID());

  const [step, setStep] = useState<BookingStep>('service');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const couponDiscount = couponResult?.valid ? couponResult.discount : 0;
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [apiAvailability, setApiAvailability] = useState<DayAvailability[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [eventType, setEventType] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [numDays, setNumDays] = useState(1);

  const effectiveDurationMinutes = isMultiDay
    ? Math.max(numDays, 1) * 24 * 60
    : getDurationMinutes(selectedService);
  const [location, setLocation] = useState('');
  const [clientCoords, setClientCoords] = useState<Coordinates | null>(null);
  const artistBaseCoords = useMemo(() => {
    if (artist?.baseLocationLat == null || artist?.baseLocationLng == null) {
      return null;
    }
    return { lat: artist.baseLocationLat, lng: artist.baseLocationLng };
  }, [artist?.baseLocationLat, artist?.baseLocationLng]);

  const travelDistanceKm = useMemo(() => {
    if (!clientCoords || !artistBaseCoords) {
      return null;
    }
    return calculateDistanceKm(artistBaseCoords, clientCoords);
  }, [artistBaseCoords, clientCoords]);

  const minAdvanceHours = useMemo(() => {
    if (travelDistanceKm !== null && travelDistanceKm <= 60 && artist?.allowSameDayBooking !== false) {
      return 3;
    }
    return 24;
  }, [travelDistanceKm, artist?.allowSameDayBooking]);
  const [locationMode, setLocationMode] = useState<'manual' | 'auto'>('manual');
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoLocationRequestSent, setAutoLocationRequestSent] = useState(false);
  const [clientEvents, setClientEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventId);

  useEffect(() => {
    if (locationError && (location || clientCoords)) {
      setLocationError(null);
    }
  }, [location, clientCoords, locationError]);
  const upsertAvailabilityForDate = useCallback((dateKey: string, slots: TimeSlot[]) => {
    setApiAvailability((prev) => {
      const filtered = prev.filter((day) => day.date !== dateKey);
      return [...filtered, { date: dateKey, slots }];
    });
  }, []);
  const injectFallbackSlots = useCallback(
    (date: Date, service: Service | null) => {
      const duration = getDurationMinutes(service);
      const slots = DEFAULT_SLOT_TIMES.map((time) => createTimeSlotForDate(date, time, duration));
      upsertAvailabilityForDate(getDateKey(date), slots);
    },
    [upsertAvailabilityForDate]
  );
  const marchYear = useMemo(() => new Date().getFullYear(), []);
  const marchAvailability = useMemo(
    () => buildMarchAvailability(marchYear, getDurationMinutes(selectedService)),
    [marchYear, selectedService]
  );
  const availability = useMemo(() => {
    const map = new Map<string, DayAvailability>();
    marchAvailability.forEach((day) => map.set(day.date, day));
    apiAvailability.forEach((day) => map.set(day.date, day));
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [marchAvailability, apiAvailability]);
  const minSelectableDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const bookingRedirectTarget = useMemo(() => {
    const params = new URLSearchParams();
    const artistParam = resolvedArtistId || artistId;
    if (artistParam) params.set('artistId', artistParam);
    if (serviceId) params.set('serviceId', serviceId);
    return params.toString() ? `/booking?${params.toString()}` : '/booking';
  }, [artistId, resolvedArtistId, serviceId]);

  const handleUseDetectedLocation = useCallback((isAutoAttempt: boolean = false) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!isAutoAttempt) {
        setLocationError('Tu navegador no permite detectar la ubicación automáticamente.');
      }
      return;
    }

    setLocationMode('auto');
    setRequestingLocation(true);
    if (!isAutoAttempt) {
      setLocationError(null);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRequestingLocation(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setClientCoords(coords);
        setLocation((prev) => prev || `Ubicación detectada (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      },
      (error: GeolocationPositionError) => {
        setRequestingLocation(false);
        setClientCoords(null);
        setLocationMode('manual');
        const errorMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Necesitamos permiso para detectar tu ubicación automáticamente.'
            : 'No pudimos obtener tu ubicación. Intenta de nuevo o ingrésala manualmente.';
        setLocationError((prev) => (isAutoAttempt ? prev ?? errorMessage : errorMessage));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const handleResetDetectedLocation = useCallback(() => {
    setClientCoords(null);
    setLocationMode('manual');
    setRequestingLocation(false);
    setLocationError(null);
  }, []);

  const handleMapLocationSelect = useCallback((lat: number, lng: number) => {
    setClientCoords({ lat, lng });
    setLocationMode('auto');
    setLocation((prev) => prev || `Coordenadas ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setLocationError(null);
  }, []);

  useEffect(() => {
    if (autoLocationRequestSent) return;
    setAutoLocationRequestSent(true);
    handleUseDetectedLocation(true);
  }, [autoLocationRequestSent, handleUseDetectedLocation]);

  useEffect(() => {
    if (step !== 'details') return;
    let mounted = true;
    setEventsLoading(true);
    sdk.getClientEvents()
      .then((data: any) => { if (mounted) setClientEvents((data ?? []).filter((e: any) => e.status !== 'CANCELLED')); })
      .catch(() => {})
      .finally(() => { if (mounted) setEventsLoading(false); });
    return () => { mounted = false; };
  }, [step]);

  // Pre-populate clientCoords from the selected event's saved location
  useEffect(() => {
    if (!selectedEventId || clientEvents.length === 0) return;
    const ev = clientEvents.find((e: any) => e.id === selectedEventId);
    if (ev?.locationLat != null && ev?.locationLng != null) {
      setClientCoords({ lat: ev.locationLat, lng: ev.locationLng });
      if (ev.location) setLocation(ev.location);
    }
  }, [selectedEventId, clientEvents]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(bookingRedirectTarget)}`);
    }
  }, [authLoading, isAuthenticated, router, bookingRedirectTarget]);

  const loadBookingData = useCallback(async () => {
    try {
      if (!artistId && !serviceId) {
        setLoadError('Selecciona un artista y servicio para continuar.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      let effectiveArtistId = artistId;
      let preselectedService: Service | null = null;

      if (!effectiveArtistId && serviceId) {
        const service = await sdk.getService(serviceId);
        if (!service || !service.artistId) {
          setArtist(null);
          setServices([]);
          setLoadError('No pudimos encontrar este servicio.');
          return;
        }
        preselectedService = service;
        effectiveArtistId = service.artistId;
      }

      if (!effectiveArtistId) {
        setArtist(null);
        setServices([]);
        setLoadError('No pudimos identificar al artista de esta reserva.');
        return;
      }

      setResolvedArtistId(effectiveArtistId);

      const [artistData, servicesDataRaw] = await Promise.all([
        sdk.getArtist(effectiveArtistId),
        sdk.getArtistServices(effectiveArtistId),
      ]);

      if (!artistData) {
        setArtist(null);
        setServices([]);
        setLoadError('No pudimos encontrar información de este artista.');
        return;
      }

      const servicesData = Array.isArray(servicesDataRaw) ? [...servicesDataRaw] : [];
      if (preselectedService && !servicesData.some((s) => s.id === preselectedService.id)) {
        servicesData.push(preselectedService);
      }

      setArtist(artistData);
      setServices(servicesData);

      // Fetch blocked/occupied dates for current month
      const now = new Date();
      sdk.getCalendar(effectiveArtistId, now.getFullYear(), now.getMonth() + 1)
        .then((data: any) => {
          const blocked: Date[] = [
            ...(data.blockedDates ?? []),
            ...(data.occupiedDates ?? []),
          ].map((d: string) => {
            const [y, mo, day] = d.split('-').map(Number);
            return new Date(y, mo - 1, day);
          });
          setDisabledDates(blocked);
        })
        .catch(() => {
          console.warn('calendar load failed — blocked dates unavailable');
          toast.warning('No se pudieron cargar las fechas bloqueadas. Verifica disponibilidad con el artista.');
        });

      if (serviceId) {
        const serviceMatch = servicesData.find((s) => s.id === serviceId) || preselectedService;
        if (serviceMatch) {
          setSelectedService(serviceMatch);
          setSelectedAddons(getDefaultAddonIds(serviceMatch));
          setStep('datetime');
        }
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      setLoadError('No pudimos cargar la información de la reserva. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [artistId, serviceId]);

  useEffect(() => {
    if (isAuthenticated && (artistId || serviceId)) {
      loadBookingData();
    }
  }, [isAuthenticated, artistId, serviceId, loadBookingData]);

  const calculatePriceQuote = useCallback(
    async (
      service: Service,
      addonIds: string[],
      coords?: Coordinates | null,
      distanceKm?: number | null
    ) => {
      setPriceLoading(true);
      setPriceError(null);
      try {
        // Use effectiveDurationMinutes so multi-day bookings reach the backend
        // with the full duration (numDays × 1440 min), enabling viáticos logic.
        const durationMinutes = effectiveDurationMinutes;
        const payload = {
          serviceId: service.id,
          durationMinutes,
          selectedAddonIds: addonIds,
        } as CalculateServicePricePayload;

        if (coords) {
          payload.locationLat = coords.lat;
          payload.locationLng = coords.lng;
        }

        if (typeof distanceKm === 'number' && Number.isFinite(distanceKm)) {
          payload.distanceKm = Number(distanceKm.toFixed(2));
        }

        const quote = await sdk.calculateServicePrice(payload);

        if (!quote) {
          setPriceQuote(null);
          setPriceError('No pudimos calcular el precio en este momento.');
          return;
        }

        setPriceQuote(quote);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.info('Falling back to estimated pricing after pricing API error.');
        }
        setPriceQuote(buildFallbackQuote(service, addonIds, coords, distanceKm));
        setPriceError('Mostrando un precio estimado mientras activamos el cálculo en vivo.');
      } finally {
        setPriceLoading(false);
      }
    }, [effectiveDurationMinutes]
  );

  const fetchCalendarForMonth = useCallback(async (artistId: string, year: number, month: number) => {
    setCalendarLoading(true);
    try {
      const data = await sdk.getCalendar(artistId, year, month);
      const blocked: Date[] = [
        ...(data.blockedDates ?? []),
        ...(data.occupiedDates ?? []),
      ].map((d: string) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day);
      });
      setDisabledDates((prev) => {
        // Merge: keep dates outside this month, replace this month's entries
        const outside = prev.filter((d) => !(d.getFullYear() === year && d.getMonth() + 1 === month));
        return [...outside, ...blocked];
      });
    } catch {
      // silently ignore — calendar still works without blocked-date highlights
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const fetchTimeSlotsForDate = useCallback(async (date: Date) => {
    if (!resolvedArtistId) return;
    const dateStr = getDateKey(date);

    setSlotsLoading(true);
    try {
      const data = await sdk.getTimeSlots(resolvedArtistId, dateStr);
      const slots = data.slots || [];
      const hasAvailableSlots = slots.some((slot) => slot.available);

      if (isMarchDate(date)) {
        if (hasAvailableSlots) {
          upsertAvailabilityForDate(dateStr, slots);
        } else {
          injectFallbackSlots(date, selectedService);
        }
      } else {
        upsertAvailabilityForDate(dateStr, slots);
      }
    } catch (error) {
      if (isMarchDate(date)) {
        injectFallbackSlots(date, selectedService);
      } else if (process.env.NODE_ENV !== 'production') {
        console.info('Availability API error, showing fallback slots.');
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [resolvedArtistId, injectFallbackSlots, selectedService, upsertAvailabilityForDate]);

  useEffect(() => {
    if (!selectedService) {
      setPriceQuote(null);
      return;
    }
    // National artists (coverageRadius === null) never charge travel — don't send distanceKm
    // so the backend calculates travelCostCents = 0.
    const effectiveDistanceKm = artist?.coverageRadius === null ? null : travelDistanceKm;
    calculatePriceQuote(selectedService, selectedAddons, clientCoords, effectiveDistanceKm);
  }, [selectedService, selectedAddons, clientCoords, travelDistanceKm, artist?.coverageRadius, calculatePriceQuote]);

  const addons = useMemo(() => selectedService?.addons ?? [], [selectedService]);
  const { currency, formatPrice } = useCurrency();
  const pricingItems = useMemo(() => {
    // Viáticos se activa cuando: multi-día (>1 día) Y fuera del radio de cobertura.
    // Sin ubicación aún mostramos el label "Viáticos" como indicativo si es multi-día,
    // ya que la mayoría de reservas multi-día implican desplazamiento fuera de cobertura.
    const coverageRadius = artist?.coverageRadius ?? null;
    const isNational = coverageRadius === null;
    const outsideCoverage =
      isNational
        ? false // artista nacional — siempre dentro de cobertura, sin cobro
        : travelDistanceKm != null ? travelDistanceKm > coverageRadius : null; // null = sin datos aún

    const isMultiDayBooking = isMultiDay && numDays > 1;
    const showViaticoLabel = isMultiDayBooking && (outsideCoverage !== false);

    const travelFeeDisplay = {
      id: 'travel-fee',
      label: isNational
        ? 'Traslado incluido'
        : (showViaticoLabel ? 'Viáticos' : 'Costo de traslado'),
      description: isNational
        ? 'Artista con cobertura nacional — sin cobro de viáticos ni traslado.'
        : (showViaticoLabel
          ? clientCoords
            ? `Incluye transporte, comida y hospedaje por ${numDays} días.`
            : `Agrega tu ubicación para calcular los viáticos (${numDays} días).`
          : clientCoords
            ? 'Usaremos tu ubicación para estimar este monto.'
            : 'Agrega tu ubicación para calcular el traslado.'),
      amount: 0,
      type: 'fee' as const,
    };

    if (priceQuote) {
      const mapped = priceQuote.items.map((item, index) => {
        const isTravel = item.type === 'TRAVEL';
        return {
          id: `${item.type}-${index}`,
          // Always use our computed label/description for TRAVEL items so
          // multi-day bookings show "Viáticos" even when the fallback quote
          // has a hardcoded name like "Costo de traslado".
          label: isTravel ? travelFeeDisplay.label : item.name,
          description: isTravel ? travelFeeDisplay.description : undefined,
          amount: centsToUnits(item.totalPriceCents),
          type: (
            item.type === 'ADDON'
              ? 'addon'
              : item.type === 'DISCOUNT'
                ? 'discount'
                : item.type === 'TRAVEL'
                  ? 'fee'
                  : 'base'
          ) as "addon" | "discount" | "fee" | "base" | "tax" | undefined,
        };
      });

      const hasTravelFee = priceQuote.items.some((item) => item.type === 'TRAVEL');
      return hasTravelFee ? mapped : [...mapped, travelFeeDisplay];
    }

    if (!selectedService) return [];

    const baseItem = {
      id: 'service',
      label: selectedService.name,
      amount: centsToUnits(selectedService.basePrice),
      type: 'base' as const,
    };

    const addonItems = addons
      .filter((addon) => selectedAddons.includes(addon.id))
      .map((addon) => ({
        id: addon.id,
        label: addon.name,
        description: addon.description,
        amount: centsToUnits(addon.price),
        type: 'addon' as const,
      }));

    return [baseItem, ...addonItems, travelFeeDisplay];
  }, [priceQuote, selectedService, addons, selectedAddons, clientCoords, isMultiDay, numDays, travelDistanceKm, artist]);

  // Funnel: track enter on mount
  const funnelTrackedInitial = useRef(false);
  useEffect(() => {
    if (funnelTrackedInitial.current) return;
    funnelTrackedInitial.current = true;
    sdk.trackFunnelEvent({
      sessionId,
      step: 'service',
      action: 'enter',
      userId: user?.id,
      artistId: artistId || undefined,
      serviceId: serviceId || undefined,
    });
  }, [sessionId, user?.id, artistId, serviceId]);

  const handleServiceSelect = (service: Service) => {
    // Funnel: complete 'service', enter 'datetime'
    sdk.trackFunnelEvent({ sessionId, step: 'service', action: 'complete', userId: user?.id, artistId: service.artistId, serviceId: service.id });
    sdk.trackFunnelEvent({ sessionId, step: 'datetime', action: 'enter', userId: user?.id, artistId: service.artistId, serviceId: service.id });
    setSelectedService(service);
    setSelectedAddons(getDefaultAddonIds(service));
    setApiAvailability([]);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedTimeSlot(undefined);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setSelectedTimeSlot(undefined);

    const dateStr = date.toISOString().split('T')[0];
    const dayAvailability = availability.find((day) => day.date === dateStr);
    const hasBookableSlots = dayAvailability?.slots.some((slot) => slot.available) ?? false;

    if (!hasBookableSlots) {
      if (isMarchDate(date)) {
        injectFallbackSlots(date, selectedService);
      } else {
        fetchTimeSlotsForDate(date);
      }
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayAvailability = availability.find((day) => day.date === dateStr);
      const slot = dayAvailability?.slots.find((s) => s.time === time);

      if (slot) {
        setSelectedTimeSlot(slot);
      } else {
        // Fallback: create synthetic slot if API did not include it
        const [h, m] = time.split(':').map(Number);
        const start = new Date(selectedDate);
        start.setHours(h, m, 0, 0);
        const end = new Date(start.getTime() + getDurationMinutes(selectedService) * 60000);
        setSelectedTimeSlot({
          time,
          available: true,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
      }
    }
  };

  const handleDateTimeNext = () => {
    if (selectedDate && selectedTime && selectedTimeSlot) {
      sdk.trackFunnelEvent({ sessionId, step: 'datetime', action: 'complete', userId: user?.id, artistId: resolvedArtistId || undefined, serviceId: selectedService?.id });
      sdk.trackFunnelEvent({ sessionId, step: 'details', action: 'enter', userId: user?.id, artistId: resolvedArtistId || undefined, serviceId: selectedService?.id });
      setStep('details');
    }
  };

  const handleDetailsNext = () => {
    if (location || clientCoords) {
      sdk.trackFunnelEvent({ sessionId, step: 'details', action: 'complete', userId: user?.id, artistId: resolvedArtistId || undefined, serviceId: selectedService?.id });
      sdk.trackFunnelEvent({ sessionId, step: 'review', action: 'enter', userId: user?.id, artistId: resolvedArtistId || undefined, serviceId: selectedService?.id });
      setStep('review');
      return;
    }
    setLocationError('Comparte tu ubicación o ingrésala manualmente para continuar.');
  };

  const toggleAddon = (addonId: string, isRequired?: boolean) => {
    if (isRequired) return;
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const [submitStage, setSubmitStage] = useState<'idle' | 'creating' | 'checkout' | 'waiting' | 'saved-card'>('idle');
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [paymentIframeUrl, setPaymentIframeUrl] = useState<string | null>(null);
  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] = useState(false);
  const [savedCard, setSavedCard] = useState<import('@piums/sdk').SavedPaymentMethod | null | undefined>(undefined);
  const [useSavedCard, setUseSavedCard] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Load saved default payment method when user reaches review step
  useEffect(() => {
    if (step === 'review' && savedCard === undefined && isAuthenticated) {
      sdk.getDefaultPaymentMethod()
        .then((method) => setSavedCard(method))
        .catch(() => setSavedCard(null));
    }
  }, [step, savedCard, isAuthenticated]);

  const startPaymentPolling = (bookingId: string) => {
    setPendingBookingId(bookingId);
    setSubmitStage('waiting');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const booking = await sdk.getBooking(bookingId).catch(() => null);
        const paymentStatus = (booking as any)?.paymentStatus;

        if (paymentStatus === 'FULLY_PAID' || paymentStatus === 'ANTICIPO_PAID' || paymentStatus === 'DEPOSIT_PAID') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setPaymentIframeUrl(null);
          setShowConfirmModal(false);
          setSubmitStage('idle');
          setSubmitting(false);
          setPendingBookingId(null);
          router.push(`/booking/confirmation/${bookingId}?responseCode=00`);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !artist || !user || !selectedTimeSlot) return;

    try {
      setSubmitting(true);
      setSubmitStage('creating');

      const effectiveArtistId = resolvedArtistId || selectedService.artistId;
      const payload = {
        clientId: user.id,
        artistId: effectiveArtistId,
        serviceId: selectedService.id,
        scheduledDate: selectedTimeSlot.startTime,
        durationMinutes: effectiveDurationMinutes,
        location: location || undefined,
        locationLat: clientCoords?.lat,
        locationLng: clientCoords?.lng,
        clientLat: clientCoords?.lat,
        clientLng: clientCoords?.lng,
        eventType: eventType || undefined,
        clientNotes: notes || undefined,
        selectedAddons: selectedAddons.length ? selectedAddons : undefined,
        eventId: selectedEventId || undefined,
        ...(couponCode ? { couponCode } : {}),
      } as any;

      sdk.trackFunnelEvent({ sessionId, step: 'review', action: 'complete', userId: user?.id, artistId: (payload as any).artistId, serviceId: (payload as any).serviceId });
      sdk.trackFunnelEvent({ sessionId, step: 'checkout', action: 'enter', userId: user?.id, artistId: (payload as any).artistId, serviceId: (payload as any).serviceId });

      const booking = await sdk.createBooking(payload);

      const amountForIntent = (booking as any).anticipoRequired && (booking as any).anticipoAmount != null
        ? (booking as any).anticipoAmount
        : booking.totalPrice;

      // One-click checkout with saved card
      if (useSavedCard && savedCard) {
        setSubmitStage('saved-card');
        try {
          await sdk.chargeWithSavedCard(
            savedCard.id,
            booking.id,
            amountForIntent,
            (booking as any).currency || 'USD',
          );
          setShowConfirmModal(false);
          setSubmitStage('idle');
          setSubmitting(false);
          router.push(`/booking/confirmation/${booking.id}?responseCode=00`);
          return;
        } catch (savedCardError: any) {
          // If saved card fails, fall through to normal checkout
          toast.error(savedCardError.message || 'Error al cobrar la tarjeta guardada. Elige otro método de pago.');
          setUseSavedCard(false);
          setSubmitStage('idle');
          setSubmitting(false);
          return;
        }
      }

      setSubmitStage('checkout');
      let pi;
      try {
        pi = await sdk.initCheckout(
          booking.id,
          amountForIntent,
          (booking as any).currency || 'USD',
          (booking as any).clientCountryCode,
        );
      } catch (checkoutError) {
        try { await sdk.cancelBooking(booking.id, 'Error al iniciar el pago'); } catch {}
        throw checkoutError;
      }

      if (pi.redirectUrl) {
        // Embed Tilopay inside the modal so the user never leaves piums.io
        setPaymentIframeUrl(pi.redirectUrl);
        startPaymentPolling(booking.id);
      } else if (pi.clientSecret) {
        // Stripe fallback — use dedicated checkout page
        setShowConfirmModal(false);
        router.push(`/booking/checkout?bookingId=${booking.id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setShowConfirmModal(false);
      setSubmitStage('idle');
      setSubmitting(false);
      const message = error instanceof Error ? error.message : 'Error al crear la reserva. Por favor intenta de nuevo.';
      toast.error(message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={user?.nombre ?? user?.email ?? 'Usuario'} />
        <div className="flex-1 min-w-0 flex items-center justify-center"><Loading /></div>
      </div>
    );
  }

  if (!artist || !resolvedArtistId) {
    return (
      <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
        <ClientSidebar userName={user?.nombre ?? user?.email ?? 'Usuario'} />
        <div className="flex-1 min-w-0 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{loadError || 'Información de reserva no válida'}</h2>
            <Button onClick={() => router.push('/artists')} className="mt-4">Ver Artistas</Button>
          </div>
        </div>
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

  const userName = user?.nombre ?? user?.email ?? 'Usuario';

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <div className="flex-1 min-w-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
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
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">Completa los siguientes pasos para confirmar tu reserva</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CurrencyToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                {steps.map((s, idx) => (
                  <React.Fragment key={s.key}>
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${step === s.key
                          ? 'bg-[#FF6B35] text-white ring-4 ring-[#FF6B35]/20'
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
                      <span className={`ml-2 text-sm font-medium hidden sm:block transition-colors ${step === s.key ? 'text-[#FF6B35]' : 'text-gray-700'
                        }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-all ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
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
                            className={`group p-6 border-2 rounded-lg cursor-pointer transition-all ${selectedService?.id === service.id
                                ? 'border-[#FF6B35] bg-[#FF6B35]/5 shadow-md'
                                : 'border-gray-200 hover:border-[#FF6B35]/50 hover:shadow-sm'
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
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#FF6B35] flex items-center justify-center">
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
                                    {service.duration ? `${Math.floor(service.duration / 60)} horas` : 'Duración variable'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-2xl font-bold text-[#FF6B35]">
                                  ${(service.basePrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
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
                        <CardTitle>{isMultiDay ? 'Selecciona Fechas y Hora de inicio' : 'Selecciona Fecha y Hora'}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Elige una fecha y horario disponible para tu {selectedService.name}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {/* Multi-day toggle */}
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">¿El servicio dura más de un día?</p>
                              <p className="text-xs text-gray-500 mt-0.5">Activa esta opción para reservar varios días seguidos</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setIsMultiDay((v) => !v); setNumDays(1); }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isMultiDay ? 'bg-[#FF6B35]' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              isMultiDay ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        {isMultiDay && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3 flex-wrap">
                              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Número de días:</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNumDays((n) => Math.max(1, n - 1))}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-medium"
                                >−</button>
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={numDays}
                                  onChange={(e) => setNumDays(Math.min(30, Math.max(1, Number(e.target.value))))}
                                  className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNumDays((n) => Math.min(30, n + 1))}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-medium"
                                >+</button>
                              </div>
                              {selectedDate && (
                                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                                  <span className="text-xs font-medium text-orange-700">
                                    {selectedDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
                                    {' → '}
                                    {new Date(selectedDate.getTime() + (numDays - 1) * 86400000).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-xs text-orange-500">({numDays} {numDays === 1 ? 'día' : 'días'})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <CalendarPicker
                        availability={availability}
                        selectedDate={selectedDate}
                        rangeEndDate={
                          isMultiDay && selectedDate && numDays > 1
                            ? new Date(selectedDate.getTime() + (numDays - 1) * 86400000)
                            : undefined
                        }
                        selectedTime={selectedTime}
                        onDateSelect={handleDateSelect}
                        onTimeSelect={handleTimeSelect}
                        onMonthChange={(y, m) => {
                          if (resolvedArtistId) fetchCalendarForMonth(resolvedArtistId, y, m);
                        }}
                        minDate={minSelectableDate}
                        disabledDates={disabledDates}
                        isLoading={slotsLoading}
                        isMonthLoading={calendarLoading}
                        minAdvanceHours={minAdvanceHours}
                      />

                      {/* Selected range summary for multi-day */}
                      {isMultiDay && selectedDate && selectedTime && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                          <svg className="h-5 w-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-green-800">Período seleccionado</p>
                            <p className="text-sm text-green-700 mt-0.5">
                              Inicio: {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedTime}
                            </p>
                            <p className="text-sm text-green-700">
                              Fin: {new Date(selectedDate.getTime() + (numDays - 1) * 86400000).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      )}

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
                      <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-700">
                            {artist.nombre} se desplaza desde {artist.baseLocationLabel || artist.city || 'una ubicación aún no publicada'}.
                          </p>
                          {artist.coverageRadius != null ? (
                            <p className="text-xs text-gray-500 mt-2">
                              Incluye hasta {artist.coverageRadius} km sin costo adicional antes de aplicar traslado.
                            </p>
                          ) : (
                            <p className="text-xs text-green-700 mt-2">
                              Artista nacional — cubre todo el país sin restricción geográfica.
                            </p>
                          )}
                          {!artistBaseCoords && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-2 px-2 py-1">
                              Este artista aún no ha registrado su ubicación base. No podemos calcular el costo de traslado automáticamente — contáctale para confirmar condiciones.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ubicación del Evento *
                          </label>
                          <Input
                            placeholder="Dirección completa del evento"
                            value={location}
                            onChange={(e) => {
                              setLocation(e.target.value);
                              if (locationMode !== 'manual') {
                                setLocationMode('manual');
                              }
                            }}
                            required={!clientCoords}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Proporciona la dirección exacta donde se realizará el servicio
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUseDetectedLocation()}

                              disabled={requestingLocation}
                              className={`${locationMode === 'auto' ? 'border-[#FF6B35] text-[#FF6B35]' : ''}`}
                            >
                              {requestingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                            </Button>
                            {clientCoords && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetDetectedLocation}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Editar manualmente
                              </Button>
                            )}
                          </div>
                          {clientCoords && (
                            <p className="text-sm text-green-600">
                              Ubicación detectada: {clientCoords.lat.toFixed(4)}, {clientCoords.lng.toFixed(4)}
                            </p>
                          )}
                          {locationError && (
                            <p className="text-sm text-red-600">{locationError}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Coloca el pin en el mapa
                          </p>
                          <LocationPickerMap
                            latitude={clientCoords?.lat ?? null}
                            longitude={clientCoords?.lng ?? null}
                            onSelect={handleMapLocationSelect}
                          />
                          <p className="text-sm text-gray-500">
                            Da clic en el mapa para marcar el punto exacto del evento. Puedes ajustar la dirección manualmente si lo prefieres.
                          </p>
                        </div>
                      </div>

                      {/* 60km same-day alert */}
                      {travelDistanceKm !== null && travelDistanceKm <= 60 && artist?.allowSameDayBooking !== false && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <svg className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Reserva con solo 3h de anticipación</p>
                            <p className="text-sm text-green-700 mt-0.5">
                              Tu ubicación está a {travelDistanceKm.toFixed(1)} km del artista. Puedes reservar el mismo día con al menos 3 horas de anticipación.
                            </p>
                          </div>
                        </div>
                      )}

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
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddons.includes(addon.id)
                                    ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                onClick={() => toggleAddon(addon.id)}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedAddons.includes(addon.id)}
                                      onChange={() => { }}
                                      className="h-4 w-4 text-[#F59E0B] focus:ring-[#F59E0B] border-gray-300 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <p className="font-medium text-gray-900">{addon.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                                  </div>
                                  <div className="ml-4 text-right">
                                    <p className="font-semibold text-[#F59E0B]">
                                      +${(addon.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tipo de Evento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ¿Para qué es el evento? <span className="text-gray-400 font-normal">(Opcional)</span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {EVENT_TYPE_OPTIONS.map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setEventType(eventType === value ? '' : value)}
                              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all ${
                                eventType === value
                                  ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={20} />
                              <span className="text-xs font-medium leading-tight">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notas Adicionales (Opcional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors text-gray-900"
                          rows={4}
                          placeholder="Información adicional sobre el evento, preferencias especiales, etc."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Comparte cualquier detalle importante que el artista deba saber
                        </p>
                      </div>

                      {/* Evento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Asociar a un Evento <span className="text-gray-400 font-normal">(Opcional)</span>
                        </label>
                        {eventId ? (
                          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <svg className="h-5 w-5 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-semibold text-orange-800">
                                {clientEvents.find((e: any) => e.id === eventId)?.name || 'Cargando evento…'}
                              </p>
                              <p className="text-xs text-orange-600 mt-0.5">Esta reserva quedará asociada a este evento automáticamente</p>
                            </div>
                          </div>
                        ) : eventsLoading ? (
                          <p className="text-sm text-gray-400">Cargando eventos…</p>
                        ) : clientEvents.length === 0 ? (
                          <p className="text-sm text-gray-500">No tienes eventos activos. <a href="/events" className="text-[#FF6B35] underline">Crea uno aquí</a>.</p>
                        ) : (
                          <div className="relative">
                            <select
                              value={selectedEventId ?? ''}
                              onChange={(e) => setSelectedEventId(e.target.value || null)}
                              className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-700 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 focus:bg-white outline-none transition hover:border-gray-300"
                            >
                              <option value="">Sin evento</option>
                              {clientEvents.map((ev: any) => (
                                <option key={ev.id} value={ev.id}>
                                  {ev.name} — {ev.status === 'DRAFT' ? 'Borrador' : 'Activo'} · {(ev.bookings ?? []).length} reservas
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        )}
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
                          disabled={!location && !clientCoords}
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
                              {selectedDate.toLocaleDateString('es-GT', {
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
                              {isMultiDay
                                ? `${numDays} día${numDays === 1 ? '' : 's'}`
                                : (selectedService.duration ? `${Math.floor(selectedService.duration / 60)} hora${Math.floor(selectedService.duration / 60) === 1 ? '' : 's'}` : 'Duración variable')}
                            </dd>
                          </div>
                          {isMultiDay && selectedDate && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Fecha de fin:</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {new Date(selectedDate.getTime() + (numDays - 1) * 86400000).toLocaleDateString('es-GT', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Ubicación:</dt>
                            <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">
                              {location || (clientCoords ? 'Ubicación detectada automáticamente' : 'Pendiente')}
                            </dd>
                          </div>
                          {clientCoords && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Coordenadas detectadas:</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {clientCoords.lat.toFixed(4)}, {clientCoords.lng.toFixed(4)}
                              </dd>
                            </div>
                          )}
                          {eventType && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Tipo de evento:</dt>
                              <dd className="text-sm font-medium text-orange-700">
                                {{ CUMPLEANOS:'Cumpleaños', BODA:'Boda', GRADUACION:'Graduación', QUINCEANERA:'Quinceañera', CORPORATIVO:'Corporativo', CONCIERTO:'Concierto', FIESTA:'Fiesta', BABY_SHOWER:'Baby Shower', BAUTIZO:'Bautizo', ANIVERSARIO:'Aniversario', OTRO:'Otro' }[eventType] ?? eventType}
                              </dd>
                            </div>
                          )}
                          {notes && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Notas:</dt>
                              <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">
                                {notes}
                              </dd>
                            </div>
                          )}
                          {selectedEventId && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Evento:</dt>
                              <dd className="text-sm font-medium text-orange-700">
                                {clientEvents.find((e: any) => e.id === selectedEventId)?.name || selectedEventId}
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

                      {/* Cupón de descuento */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Código de cupón</h4>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!couponInput.trim()) return;
                            setCouponValidating(true);
                            setCouponResult(null);
                            try {
                              const totalCents = priceQuote?.totalCents ?? (selectedService?.basePrice ?? 0);
                              const res = await sdk.validateCoupon(
                                couponInput.trim().toUpperCase(),
                                totalCents / 100,
                                resolvedArtistId || undefined,
                                selectedService?.id,
                              );
                              setCouponResult(res);
                              if (res.valid) setCouponCode(couponInput.trim().toUpperCase());
                              else setCouponCode('');
                            } catch {
                              setCouponResult({ valid: false, discount: 0, error: 'Error al validar el cupón' });
                              setCouponCode('');
                            } finally {
                              setCouponValidating(false);
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponResult(null); setCouponCode(''); }}
                            placeholder="Código de cupón"
                            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-mono font-semibold tracking-wider text-gray-900 placeholder:font-normal placeholder:tracking-normal outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition"
                          />
                          <button
                            type="submit"
                            disabled={couponValidating || !couponInput.trim()}
                            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          >
                            {couponValidating ? 'Aplicando...' : 'Aplicar'}
                          </button>
                        </form>
                        {couponResult && (
                          <div className={`mt-2 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${
                            couponResult.valid
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {couponResult.valid ? (
                              <>
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Cupón aplicado — Descuento:{' '}
                                <strong>
                                  {couponResult.coupon?.discountType === 'PERCENTAGE'
                                    ? `${couponResult.coupon.discountValue}%`
                                    : `$${couponResult.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                </strong>
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {couponResult.error || 'Cupón no válido'}
                              </>
                            )}
                          </div>
                        )}
                        {couponDiscount > 0 && (
                          <div className="mt-2 flex justify-between text-sm font-semibold text-green-700 bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
                            <span>Descuento aplicado:</span>
                            <span>-${couponDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
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
                items={pricingItems}
                currency={currency}
              />
              {priceLoading && (
                <p className="text-sm text-gray-500">Calculando precio...</p>
              )}
              {priceError && (
                <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {priceError}
                </div>
              )}

              <Card>
                <CardContent>
                  <h3 className="font-medium text-gray-900 mb-3">Ubicación y traslado</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Artista</p>
                      <p className="font-medium text-gray-900">
                        {artist.baseLocationLabel || artist.city || 'Ubicación pendiente'}
                      </p>
                      {artist.coverageRadius != null ? (
                        <p className="text-xs text-gray-500">
                          Incluye {artist.coverageRadius} km sin recargo
                        </p>
                      ) : (
                        <p className="text-xs text-green-600">
                          Cobertura nacional
                        </p>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Cliente</p>
                      {clientCoords ? (
                        <p className="font-medium text-gray-900">
                          Coordenadas ({clientCoords.lat.toFixed(3)}, {clientCoords.lng.toFixed(3)})
                        </p>
                      ) : location ? (
                        <p className="font-medium text-gray-900">{location}</p>
                      ) : (
                        <p className="text-gray-500">
                          Agrega la dirección o comparte tu ubicación para calcular el traslado.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardContent>
                  <h3 className="font-medium text-gray-900 mb-3">Información Importante</h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      {/* Lightning bolt — instant confirmation */}
                      <svg className="h-5 w-5 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Confirmación instantánea
                    </li>
                    <li className="flex items-start gap-2">
                      {/* Chat bubble — direct communication */}
                      <svg className="h-5 w-5 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comunicación directa con el artista
                    </li>
                    <li className="flex items-start gap-2">
                      {/* Calendar X — free cancellation */}
                      <svg className="h-5 w-5 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Cancelación gratuita (48h antes)
                    </li>
                    <li className="flex items-start gap-2">
                      {/* Headset — 24/7 support */}
                      <svg className="h-5 w-5 text-[#FF6B35] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
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

      {/* Modal de Confirmación / Pago embebido */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          if (submitStage === 'waiting') {
            setShowCancelPaymentConfirm(true);
          } else if (!submitting) {
            setShowConfirmModal(false);
          }
        }}
        onConfirm={handleConfirmBooking}
        title={submitStage === 'waiting' ? "Completa tu pago" : "Confirmar Reserva"}
        message=""
        confirmLabel={
          submitStage === 'creating' ? "Creando reserva..." :
          submitStage === 'checkout' ? "Iniciando pago..." :
          submitStage === 'saved-card' ? "Procesando pago..." :
          useSavedCard && savedCard ? `Pagar con ${savedCard.cardBrand || 'tarjeta'} ****${savedCard.cardLast4 || ''}` :
          "Sí, confirmar"
        }
        cancelLabel={submitStage === 'waiting' ? "Cancelar pago" : "Cancelar"}
        variant="info"
        isLoading={submitting && submitStage !== 'waiting'}
        hideActions={submitStage === 'waiting'}
        size={submitStage === 'waiting' ? 'xl' : 'sm'}
        confirmClassName="bg-[#FF6B35] hover:bg-[#e55a00] text-white"
        details={
          submitStage === 'waiting' && paymentIframeUrl ? (
            <div className="flex flex-col gap-0 -mx-6 -mb-4">
              {/* Trusted payment bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Procesado por <span className="font-semibold text-gray-700">Tilopay</span> · SSL encriptado
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Esperando pago...
                </div>
              </div>
              {/* Tilopay iframe */}
              <iframe
                src={paymentIframeUrl}
                className="w-full border-0"
                style={{ height: 'clamp(420px, 62vh, 580px)' }}
                title="Formulario de pago seguro"
                allow="payment"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
              />
            </div>
          ) : selectedService && selectedDate && selectedTime && artist ? (
            <div className="space-y-4">
              {/* Saved card selector */}
              {savedCard && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUseSavedCard(true)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${useSavedCard ? 'bg-orange-50 border-b border-orange-200' : 'bg-white border-b border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className={`flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${useSavedCard ? 'border-[#FF6B35]' : 'border-gray-300'}`}>
                      {useSavedCard && <div className="h-2 w-2 rounded-full bg-[#FF6B35]" />}
                    </div>
                    <svg className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize">{savedCard.cardBrand || 'Tarjeta'} ****{savedCard.cardLast4}</p>
                      {savedCard.cardExpMonth && savedCard.cardExpYear && (
                        <p className="text-xs text-gray-500">Vence {String(savedCard.cardExpMonth).padStart(2, '0')}/{savedCard.cardExpYear}</p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Guardada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSavedCard(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${!useSavedCard ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className={`flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${!useSavedCard ? 'border-[#FF6B35]' : 'border-gray-300'}`}>
                      {!useSavedCard && <div className="h-2 w-2 rounded-full bg-[#FF6B35]" />}
                    </div>
                    <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm text-gray-600">Usar otra tarjeta</span>
                  </button>
                </div>
              )}
              {/* Artist row */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <Avatar src={artist.avatar} fallback={artist.nombre} size="md" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{artist.nombre}</p>
                  <p className="text-xs text-gray-500">{artist.category}</p>
                </div>
              </div>
              {/* Details rows */}
              <div className="space-y-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="text-[#FF6B35] flex-shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </span>
                  <span className="text-sm text-gray-700">{selectedService.name}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#FF6B35] flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <span className="text-sm text-gray-700 capitalize">
                    {selectedDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#FF6B35] flex-shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-sm text-gray-700">{selectedTime}</span>
                </div>
                {selectedService.basePrice != null && (
                  <div className="flex items-center gap-3">
                    <span className="text-[#FF6B35] flex-shrink-0">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(selectedService.basePrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-gray-400 font-normal">USD</span>
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 text-center">
                Al confirmar aceptas la política de cancelación del artista.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-700">¿Estás seguro de que deseas crear esta reserva?</p>
          )
        }
      />

      {/* Modal de confirmación para cancelar el pago */}
      {showCancelPaymentConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelPaymentConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            {/* Text */}
            <div className="text-center">
              <h3 className="text-base font-semibold text-gray-900">¿Cancelar el pago?</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tu reserva será eliminada y tendrás que comenzar de nuevo si cambias de opinión.
              </p>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 mt-1">
              <button
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold py-2.5 transition-colors"
                onClick={() => {
                  setShowCancelPaymentConfirm(false);
                  clearInterval(pollIntervalRef.current!);
                  pollIntervalRef.current = null;
                  if (pendingBookingId) sdk.cancelBooking(pendingBookingId, 'Usuario canceló el pago').catch(() => {});
                  setPaymentIframeUrl(null);
                  setShowConfirmModal(false);
                  setSubmitStage('idle');
                  setSubmitting(false);
                  setPendingBookingId(null);
                }}
              >
                Sí, cancelar reserva
              </button>
              <button
                className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-semibold py-2.5 transition-colors"
                onClick={() => setShowCancelPaymentConfirm(false)}
              >
                Continuar con el pago
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
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
