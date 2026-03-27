'use client';

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
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
import type { ArtistProfile, Service, TimeSlot, PriceQuote, CalculateServicePricePayload } from '@piums/sdk';
import { LocationPickerMap } from '@/components/LocationPickerMap';

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
    currency: service.currency || 'GTQ',
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

const formatCurrency = (amount: number, currency: string = 'GTQ') =>
  new Intl.NumberFormat('es-GT', {
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

  const [step, setStep] = useState<BookingStep>('service');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        .catch(() => {});

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
    calculatePriceQuote(selectedService, selectedAddons, clientCoords, travelDistanceKm);
  }, [selectedService, selectedAddons, clientCoords, travelDistanceKm, calculatePriceQuote]);

  const addons = useMemo(() => selectedService?.addons ?? [], [selectedService]);
  const currency = priceQuote?.currency || selectedService?.currency || 'GTQ';
  const pricingItems = useMemo(() => {
    // Viáticos se activa cuando: multi-día (>1 día) Y fuera del radio de cobertura.
    // Sin ubicación aún mostramos el label "Viáticos" como indicativo si es multi-día,
    // ya que la mayoría de reservas multi-día implican desplazamiento fuera de cobertura.
    const coverageRadius = artist?.coverageRadius ?? 0;
    const outsideCoverage =
      travelDistanceKm != null ? travelDistanceKm > coverageRadius : null; // null = sin datos aún

    const isMultiDayBooking = isMultiDay && numDays > 1;
    const showViaticoLabel = isMultiDayBooking && (outsideCoverage !== false);

    const travelFeeDisplay = {
      id: 'travel-fee',
      label: showViaticoLabel ? 'Viáticos' : 'Costo de traslado',
      description: showViaticoLabel
        ? clientCoords
          ? `Incluye transporte, comida y hospedaje por ${numDays} días.`
          : `Agrega tu ubicación para calcular los viáticos (${numDays} días).`
        : clientCoords
          ? 'Usaremos tu ubicación para estimar este monto.'
          : 'Agrega tu ubicación para calcular el traslado.',
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

  const handleServiceSelect = (service: Service) => {
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
      setStep('details');
    }
  };

  const handleDetailsNext = () => {
    if (location || clientCoords) {
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

  const handleConfirmBooking = async () => {
    if (!selectedService || !artist || !user || !selectedTimeSlot) return;

    try {
      setSubmitting(true);
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
        clientNotes: notes || undefined,
        selectedAddons: selectedAddons.length ? selectedAddons : undefined,
        eventId: selectedEventId || undefined,
      };

      const booking = await sdk.createBooking(payload);
      setShowConfirmModal(false);
      router.push(`/booking/confirmation/${booking.id}`);
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
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${step === s.key
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
                      <span className={`ml-2 text-sm font-medium hidden sm:block transition-colors ${step === s.key ? 'text-[#FF6A00]' : 'text-gray-700'
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
                                    {service.duration ? `${Math.floor(service.duration / 60)} horas` : 'Duración variable'}
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
                            <span className="text-lg">📅</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">¿El servicio dura más de un día?</p>
                              <p className="text-xs text-gray-500 mt-0.5">Activa esta opción para reservar varios días seguidos</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setIsMultiDay((v) => !v); setNumDays(1); }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isMultiDay ? 'bg-[#FF6A00]' : 'bg-gray-300'
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
                                  className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00]"
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
                          {artist.coverageRadius ? (
                            <p className="text-xs text-gray-500 mt-2">
                              Incluye hasta {artist.coverageRadius} km sin costo adicional antes de aplicar traslado.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-2">
                              Comparte la dirección del evento para calcular el costo de traslado.
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
                              className={`${locationMode === 'auto' ? 'border-[#FF6A00] text-[#FF6A00]' : ''}`}
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
                                      onChange={() => { }}
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

                      {/* Evento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Asociar a un Evento <span className="text-gray-400 font-normal">(Opcional)</span>
                        </label>
                        {eventId ? (
                          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <svg className="h-5 w-5 text-[#FF6A00] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          <p className="text-sm text-gray-500">No tienes eventos activos. <a href="/events" className="text-[#FF6A00] underline">Crea uno aquí</a>.</p>
                        ) : (
                          <div className="relative">
                            <select
                              value={selectedEventId ?? ''}
                              onChange={(e) => setSelectedEventId(e.target.value || null)}
                              className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-700 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 focus:bg-white outline-none transition hover:border-gray-300"
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
                              {isMultiDay
                                ? `${numDays} día${numDays === 1 ? '' : 's'}`
                                : (selectedService.duration ? `${Math.floor(selectedService.duration / 60)} hora${Math.floor(selectedService.duration / 60) === 1 ? '' : 's'}` : 'Duración variable')}
                            </dd>
                          </div>
                          {isMultiDay && selectedDate && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Fecha de fin:</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {new Date(selectedDate.getTime() + (numDays - 1) * 86400000).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
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
                      {artist.coverageRadius && (
                        <p className="text-xs text-gray-500">
                          Incluye {artist.coverageRadius} km sin recargo
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
