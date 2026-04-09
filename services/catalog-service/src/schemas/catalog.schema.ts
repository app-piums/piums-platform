import { z } from "zod";

// Enums
export const PricingTypeEnum = z.enum(["FIXED", "HOURLY", "PER_SESSION", "CUSTOM"]);
export const ServiceStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

// Schema para crear categoría
export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid("ID de categoría padre inválido").optional(),
  order: z.number().int().min(0).optional(),
});

// Schema para actualizar categoría
export const updateCategorySchema = createCategorySchema.partial();

// Schema para crear servicio
export const createServiceSchema = z.object({
  artistId: z.string().min(1, "artistId requerido"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z.string().min(2, "El slug es requerido").regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  
  categoryId: z.string().uuid("ID de categoría inválido"),
  
  pricingType: PricingTypeEnum,
  basePrice: z.number().int().min(0, "El precio debe ser mayor o igual a 0"),
  currency: z.string().length(3).optional(),
  
  durationMin: z.number().int().min(1, "Duración mínima debe ser al menos 1 minuto").optional(),
  durationMax: z.number().int().min(1).optional(),
  
  images: z.array(z.string().url("URL inválida")).optional(),
  thumbnail: z.string().url("URL inválida").optional(),
  
  requiresDeposit: z.boolean().optional(),
  depositAmount: z.number().int().min(0).optional(),
  depositPercentage: z.number().int().min(0).max(100).optional(),
  requiresConsultation: z.boolean().optional(),

  whatIsIncluded: z.array(z.string().min(1)).optional(),

  cancellationPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  tags: z.array(z.string()).optional(),

  minGuests: z.number().int().min(1).optional(),
  maxGuests: z.number().int().min(1).optional(),
});

// Schema para actualizar servicio
export const updateServiceSchema = z.object({
  name: z.string().min(3).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).optional(),
  
  categoryId: z.string().uuid().optional(),
  
  pricingType: PricingTypeEnum.optional(),
  basePrice: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  
  durationMin: z.number().int().min(1).optional(),
  durationMax: z.number().int().min(1).optional(),
  
  images: z.array(z.string().url()).optional(),
  thumbnail: z.string().url().optional(),
  
  status: ServiceStatusEnum.optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  
  requiresDeposit: z.boolean().optional(),
  depositAmount: z.number().int().min(0).optional(),
  depositPercentage: z.number().int().min(0).max(100).optional(),
  requiresConsultation: z.boolean().optional(),

  whatIsIncluded: z.array(z.string().min(1)).optional(),

  cancellationPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  tags: z.array(z.string()).optional(),

  minGuests: z.number().int().min(1).optional(),
  maxGuests: z.number().int().min(1).optional(),
});

// Schema para addon
export const addonSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().int().min(0, "El precio debe ser mayor o igual a 0"),
  isOptional: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// Schema para paquete
export const packageSchema = z.object({
  artistId: z.string().min(1, "artistId requerido"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  serviceIds: z.array(z.string().uuid()).min(2, "Se requieren al menos 2 servicios"),
  originalPrice: z.number().int().min(0),
  packagePrice: z.number().int().min(0),
  savings: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  thumbnail: z.string().url().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

// Schema para búsqueda de servicios
export const searchServicesSchema = z.object({
  artistId: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  pricingType: PricingTypeEnum.optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  status: ServiceStatusEnum.optional(),
  isFeatured: z.boolean().optional(),
  tags: z.string().optional(), // Comma-separated tags
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
