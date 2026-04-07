import { z } from "zod";

// Enums
export const ArtistCategoryEnum = z.enum([
  "MUSICO",
  "TATUADOR",
  "FOTOGRAFO",
  "MAQUILLADOR",
  "DJ",
  "PINTOR",
  "ESCULTOR",
  "OTRO",
]);

export const VerificationStatusEnum = z.enum([
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
]);

export const DayOfWeekEnum = z.enum([
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
]);

// Schema para crear artista
export const createArtistSchema = z.object({
  authId: z.string().min(1, "authId requerido"),
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  artistName: z.string().optional(),
  bio: z.string().max(1000, "La biografía no puede exceder 1000 caracteres").optional(),
  
  category: ArtistCategoryEnum,
  specialties: z.array(z.string()).min(1, "Debes especificar al menos una especialidad"),
  yearsExperience: z.number().int().min(0).max(80, "Años de experiencia inválidos").optional(),
  
  // Ubicación
  country: z.string().min(2, "País requerido"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  baseLocationLabel: z.string().min(2).max(120).optional(),
  baseLocationLat: z.number().min(-90).max(90).optional(),
  baseLocationLng: z.number().min(-180).max(180).optional(),
  coverageRadius: z.number().int().min(1).max(500, "Radio de cobertura debe ser entre 1 y 500 km").optional(),
  
  // Pricing
  hourlyRateMin: z.number().int().min(0).optional(),
  hourlyRateMax: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  
  // Políticas
  cancellationPolicy: z.string().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercentage: z.number().int().min(0).max(100).optional(),
  
  // Equipo propio del artista
  equipment: z.array(z.string()).optional(),

  // Redes sociales
  website: z.string().url("URL inválida").optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
});

// Schema para actualizar artista
export const updateArtistSchema = z.object({
  nombre: z.string().min(2).optional(),
  artistName: z.string().optional(),
  avatar: z.string().url("URL inválida").optional(),
  bio: z.string().max(1000).optional(),
  
  category: ArtistCategoryEnum.optional(),
  specialties: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  baseLocationLabel: z.string().min(2).max(120).optional(),
  baseLocationLat: z.number().min(-90).max(90).optional(),
  baseLocationLng: z.number().min(-180).max(180).optional(),
  coverageRadius: z.number().int().min(1).max(500).optional(),
  
  hourlyRateMin: z.number().int().min(0).optional(),
  hourlyRateMax: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  
  cancellationPolicy: z.string().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercentage: z.number().int().min(0).max(100).optional(),
  
  equipment: z.array(z.string()).optional(),

  website: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  
  isActive: z.boolean().optional(),
});

// Schema para portfolio item
export const portfolioItemSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  type: z.enum(["image", "video", "audio"], {
    errorMap: () => ({ message: "Tipo debe ser image, video o audio" }),
  }),
  url: z.string().url("URL inválida"),
  thumbnailUrl: z.string().url("URL inválida").optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
});

// Schema para certificación
export const certificationSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  issuer: z.string().min(1, "Institución emisora requerida"),
  description: z.string().optional(),
  documentUrl: z.string().url("URL inválida").optional(),
  issuedAt: z.string().datetime("Fecha inválida"),
  expiresAt: z.string().datetime("Fecha inválida").optional(),
});

// Schema para disponibilidad
export const availabilitySchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  isAvailable: z.boolean().optional(),
});

// Schema para búsqueda de artistas
export const searchArtistsSchema = z.object({
  q: z.string().optional(),
  category: ArtistCategoryEnum.optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().int().min(1).max(500).optional(), // km
  minRating: z.number().min(0).max(5).optional(),
  verificationStatus: VerificationStatusEnum.optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
