import { z } from "zod";

// Enums
export const BookingStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PAYMENT_PENDING",
  "PAYMENT_COMPLETED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED_CLIENT",
  "CANCELLED_ARTIST",
  "REJECTED",
  "NO_SHOW",
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "DEPOSIT_PAID",
  "FULLY_PAID",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

// Schema para crear reserva
export const createBookingSchema = z.object({
  artistId: z.string().min(1, "artistId es requerido"),
  serviceId: z.string().uuid("serviceId inválido"),
  
  scheduledDate: z.string().datetime("Fecha inválida"),
  durationMinutes: z.number().int().min(15, "Duración mínima: 15 minutos").max(43200, "Duración máxima: 30 días"),
  
  location: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  
  selectedAddons: z.array(z.string().uuid()).optional(),
  
  clientNotes: z.string().max(1000).optional(),
  
  eventId: z.string().uuid().optional(),
});

// Schema para actualizar reserva
export const updateBookingSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(43200).optional(),
  location: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  selectedAddons: z.array(z.string().uuid()).optional(),
  clientNotes: z.string().max(1000).optional(),
  artistNotes: z.string().max(1000).optional(),
  reviewId: z.string().optional(),
});

// Schema para cambiar estado
export const changeStatusSchema = z.object({
  status: BookingStatusEnum,
  reason: z.string().max(500).optional(),
});

// Schema para cancelación
export const cancelBookingSchema = z.object({
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres").max(500),
});

// Schema para confirmar reserva
export const confirmBookingSchema = z.object({
  artistNotes: z.string().max(1000).optional(),
});

// Schema para rechazar reserva
export const rejectBookingSchema = z.object({
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres").max(500),
});

// Schema para marcar pago
export const markPaymentSchema = z.object({
  amount: z.number().int().min(0, "Monto debe ser mayor o igual a 0"),
  paymentMethod: z.string().optional(),
  paymentIntentId: z.string().optional(),
  paymentType: z.enum(['DEPOSIT', 'FULL_PAYMENT', 'REMAINING']).optional(),
});

// Schema para bloquear slot
export const blockSlotSchema = z.object({
  artistId: z.string().min(1, "artistId es requerido"),
  startTime: z.string().datetime("Fecha de inicio inválida"),
  endTime: z.string().datetime("Fecha de fin inválida"),
  reason: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

// Schema para configuración de disponibilidad
export const availabilityConfigSchema = z.object({
  artistId: z.string().min(1, "artistId es requerido"),
  minAdvanceHours: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  bufferMinutes: z.number().int().min(0).optional(),
  autoConfirm: z.boolean().optional(),
  requiresDeposit: z.boolean().optional(),
  cancellationHours: z.number().int().min(0).optional(),
  cancellationFee: z.number().int().min(0).max(100).optional(),
});

// Schema para consultar disponibilidad
export const checkAvailabilitySchema = z.object({
  artistId: z.string().min(1, "artistId es requerido"),
  startDate: z.string().datetime("Fecha de inicio inválida"),
  endDate: z.string().datetime("Fecha de fin inválida"),
  durationMinutes: z.number().int().min(15).optional(),
});

// Schema para búsqueda de reservas
export const searchBookingsSchema = z.object({
  clientId: z.string().optional(),
  artistId: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  status: BookingStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
