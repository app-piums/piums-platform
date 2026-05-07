import { PrismaClient, PricingModel } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Estructura de un item del desglose de precio
 */
export interface PriceItem {
  type: 'BASE' | 'ADDON' | 'TRAVEL' | 'DISCOUNT';
  name: string;
  qty: number;
  unitPriceCents: number;
  totalPriceCents: number;
  metadata?: any;
}

/**
 * Resultado del cálculo de precio
 */
export interface PriceQuote {
  serviceId: string;
  currency: string;
  items: PriceItem[];
  subtotalCents: number;
  totalCents: number;
  depositRequiredCents?: number;
  breakdown: {
    baseCents: number;
    addonsCents: number;
    travelCents: number;
    discountsCents: number;
  };
}

/**
 * Input para calcular el precio de un servicio
 */
export interface PriceCalculationInput {
  serviceId: string;
  durationMinutes?: number; // Para servicios con pricing por tiempo
  selectedAddonIds?: string[]; // IDs de los addons seleccionados
  distanceKm?: number; // Distancia en km (pre-calculada por el caller)
  discountCode?: string; // Código de descuento (futuro)
}

/**
 * Calcula el precio completo de un servicio con todos sus componentes
 */
export const calculateServicePrice = async (
  input: PriceCalculationInput
): Promise<PriceQuote> => {
  const { serviceId, durationMinutes, selectedAddonIds = [], distanceKm } = input;

  // 1. Obtener el servicio con su pricing y reglas
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      addons: true,
      pricing: true,
      travelRules: true,
    },
  });

  if (!service) {
    throw new Error(`Service not found: ${serviceId}`);
  }

  if (!service.isAvailable || service.status !== 'ACTIVE') {
    throw new Error(`Service is not available: ${serviceId}`);
  }

  const pricing = service.pricing;
  const travelRules = service.travelRules;

  const items: PriceItem[] = [];

  // ==================== CALCULAR PRECIO BASE ====================

  let basePriceCents: number;
  let currency: string;

  if (!pricing) {
    // Fallback: usar basePrice del servicio cuando no hay pricing avanzado configurado
    basePriceCents = service.basePrice || 0;
    currency = service.currency || 'USD';

    items.push({
      type: 'BASE',
      name: service.name,
      qty: 1,
      unitPriceCents: basePriceCents,
      totalPriceCents: basePriceCents,
    });
  } else {
    basePriceCents = pricing.basePriceCents;
    currency = pricing.currency;

    switch (pricing.pricingModel) {
      case 'FIXED':
        // Precio fijo, sin cálculos adicionales
        items.push({
          type: 'BASE',
          name: service.name,
          qty: 1,
          unitPriceCents: basePriceCents,
          totalPriceCents: basePriceCents,
        });
        break;

      case 'BASE_PLUS_HOURLY':
      case 'PACKAGE':
        // Precio base + minutos adicionales
        if (!durationMinutes) {
          throw new Error('durationMinutes is required for this pricing model');
        }

        const includedMinutes = pricing.includedMinutes || 0;
        const extraMinutes = Math.max(0, durationMinutes - includedMinutes);
        const extraMinuteCost = pricing.extraMinutePriceCents || 0;
        const totalExtraCost = extraMinutes * extraMinuteCost;

        // Item del precio base
        items.push({
          type: 'BASE',
          name: `${service.name} (incluye ${includedMinutes} min)`,
          qty: 1,
          unitPriceCents: basePriceCents,
          totalPriceCents: basePriceCents,
        });

        // Item de minutos adicionales (si aplica)
        if (extraMinutes > 0) {
          items.push({
            type: 'BASE',
            name: `Tiempo adicional (${extraMinutes} min)`,
            qty: extraMinutes,
            unitPriceCents: extraMinuteCost,
            totalPriceCents: totalExtraCost,
            metadata: { includedMinutes, extraMinutes },
          });
          basePriceCents += totalExtraCost;
        }
        break;
    }
  }

  // ==================== CALCULAR ADDONS ====================

  let addonsTotalCents = 0;

  if (selectedAddonIds.length > 0) {
    const selectedAddons = service.addons.filter((addon) =>
      selectedAddonIds.includes(addon.id)
    );

    for (const addon of selectedAddons) {
      items.push({
        type: 'ADDON',
        name: addon.name,
        qty: 1,
        unitPriceCents: addon.price,
        totalPriceCents: addon.price,
      });
      addonsTotalCents += addon.price;
    }
  }

  // Agregar addons obligatorios
  const requiredAddons = service.addons.filter((addon) => addon.isRequired);
  for (const addon of requiredAddons) {
    if (!selectedAddonIds.includes(addon.id)) {
      items.push({
        type: 'ADDON',
        name: `${addon.name} (obligatorio)`,
        qty: 1,
        unitPriceCents: addon.price,
        totalPriceCents: addon.price,
        metadata: { required: true },
      });
      addonsTotalCents += addon.price;
    }
  }

  // ==================== CALCULAR VIAJE / VIÁTICOS ====================

  // Tarifas de viáticos configurables por variable de entorno (en centavos GTQ)
  const VIATICOS_FOOD_PER_DAY_CENTS     = parseInt(process.env.VIATICOS_FOOD_CENTS     ?? '15000', 10); // Q 150/día
  const VIATICOS_LODGING_PER_DAY_CENTS  = parseInt(process.env.VIATICOS_LODGING_CENTS  ?? '40000', 10); // Q 400/día
  const VIATICOS_TRANSPORT_CENTS        = parseInt(process.env.VIATICOS_TRANSPORT_CENTS ?? '20000', 10); // Q 200 fijo

  const DEFAULT_PRICE_PER_KM_CENTS = 2000; // Q 20.00 por km adicional por defecto
  const DEFAULT_INCLUDED_KM = 10;          // 10 km incluidos por defecto

  // numDays: derivado de durationMinutes — multi-día cuando >= 1440 min (24h)
  const numDays = durationMinutes ? Math.ceil(durationMinutes / 1440) : 1;

  let travelCostCents = 0;

  if (distanceKm !== undefined && distanceKm > 0) {
    const includedKm = travelRules?.includedKm ?? DEFAULT_INCLUDED_KM;
    const extraKm = Math.max(0, distanceKm - includedKm);

    // Validar distancia máxima si existe regla
    if (travelRules?.maxDistanceKm && distanceKm > travelRules.maxDistanceKm) {
      throw new Error(
        `Distance ${distanceKm}km exceeds maximum allowed ${travelRules.maxDistanceKm}km`
      );
    }

    if (extraKm > 0) {
      if (numDays > 1) {
        // ── VIÁTICOS: multi-día + fuera de cobertura → tarifa plana plataforma ──
        const foodTotal    = VIATICOS_FOOD_PER_DAY_CENTS    * numDays;
        const lodgingTotal = VIATICOS_LODGING_PER_DAY_CENTS * numDays;
        travelCostCents    = foodTotal + lodgingTotal + VIATICOS_TRANSPORT_CENTS;

        items.push({
          type: 'TRAVEL',
          name: `Viáticos (${numDays} días)`,
          qty: 1,
          unitPriceCents: travelCostCents,
          totalPriceCents: travelCostCents,
          metadata: {
            type: 'VIATICOS',
            numDays,
            foodPerDay:    VIATICOS_FOOD_PER_DAY_CENTS,
            lodgingPerDay: VIATICOS_LODGING_PER_DAY_CENTS,
            transport:     VIATICOS_TRANSPORT_CENTS,
            foodTotal,
            lodgingTotal,
            distanceKm,
            includedKm,
          },
        });
      } else {
        // ── TRASLADO: día único + fuera de cobertura → precio por km ──
        const pricePerKmCents = travelRules?.pricePerKmCents ?? DEFAULT_PRICE_PER_KM_CENTS;
        if (pricePerKmCents > 0) {
          travelCostCents = Math.round(extraKm * pricePerKmCents);
          items.push({
            type: 'TRAVEL',
            name: `Desplazamiento (${extraKm.toFixed(1)} km adicionales)`,
            qty: 1,
            unitPriceCents: travelCostCents,
            totalPriceCents: travelCostCents,
            metadata: {
              type: 'TRASLADO',
              totalKm: distanceKm,
              includedKm,
              extraKm,
              pricePerKm: pricePerKmCents,
              isDefault: !travelRules || travelRules.pricePerKmCents === null,
            },
          });
        }
      }
    }
  }

  // ==================== CALCULAR SUBTOTAL Y TOTAL ====================

  const subtotalCents = basePriceCents + addonsTotalCents + travelCostCents;
  const discountsCents = 0; // Futuro: lógica de descuentos
  const totalCents = subtotalCents - discountsCents;

  // ==================== CALCULAR DEPÓSITO REQUERIDO ====================

  let depositRequiredCents: number | undefined;

  if (service.requiresDeposit) {
    if (service.depositAmount) {
      // Depósito fijo
      depositRequiredCents = service.depositAmount;
    } else if (service.depositPercentage) {
      // Depósito porcentual
      depositRequiredCents = Math.round((totalCents * service.depositPercentage) / 100);
    }
  }

  // ==================== RETORNAR COTIZACIÓN ====================

  return {
    serviceId,
    currency,
    items,
    subtotalCents,
    totalCents,
    depositRequiredCents,
    breakdown: {
      baseCents: basePriceCents,
      addonsCents: addonsTotalCents,
      travelCents: travelCostCents,
      discountsCents,
    },
  };
};

/**
 * Valida que un servicio tenga pricing configurado correctamente
 */
export const validateServicePricing = async (serviceId: string): Promise<{
  isValid: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      pricing: true,
    },
  });

  if (!service) {
    return { isValid: false, errors: ['Service not found'] };
  }

  // Validar pricing avanzado
  const pricing = service.pricing;

  if (pricing) {
    // Validar que tenga precio base
    if (!pricing.basePriceCents || pricing.basePriceCents <= 0) {
      errors.push('Base price must be greater than 0');
    }

    if (pricing.pricingModel === 'BASE_PLUS_HOURLY' || pricing.pricingModel === 'PACKAGE') {
      if (!pricing.includedMinutes || pricing.includedMinutes <= 0) {
        errors.push('includedMinutes must be set for this pricing model');
      }
      if (!pricing.extraMinutePriceCents && pricing.extraMinutePriceCents !== 0) {
        errors.push('extraMinutePriceCents must be set for this pricing model');
      }
    }
  } else {
    // Si no tiene pricing avanzado, validar el precio base del servicio
    if (!service.basePrice || service.basePrice <= 0) {
      errors.push('Base price must be greater than 0');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Obtiene un resumen de pricing de un servicio para mostrarlo al cliente
 */
export const getServicePricingSummary = async (serviceId: string) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      addons: true,
      pricing: true,
      travelRules: true,
    },
  });

  if (!service) {
    throw new Error(`Service not found: ${serviceId}`);
  }

  const pricing = service.pricing;
  const travelRules = service.travelRules;

  return {
    serviceId,
    serviceName: service.name,
    basePrice: {
      cents: pricing?.basePriceCents || service.basePrice,
      currency: pricing?.currency || service.currency,
      display: formatPrice(pricing?.basePriceCents || service.basePrice, pricing?.currency || service.currency),
    },
    pricingModel: pricing?.pricingModel || 'FIXED',
    includedMinutes: pricing?.includedMinutes,
    extraMinutePriceCents: pricing?.extraMinutePriceCents,
    addons: service.addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      description: addon.description,
      price: {
        cents: addon.price,
        currency: service.currency,
        display: formatPrice(addon.price, service.currency),
      },
      isRequired: addon.isRequired,
      isOptional: addon.isOptional,
    })),
    travelRules: travelRules
      ? {
          includedKm: travelRules.includedKm,
          pricePerKmCents: travelRules.pricePerKmCents,
          maxDistanceKm: travelRules.maxDistanceKm,
        }
      : null,
    requiresDeposit: service.requiresDeposit,
    depositAmount: service.depositAmount,
    depositPercentage: service.depositPercentage,
  };
};

/**
 * Formatea un precio en centavos a string legible
 */
function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
