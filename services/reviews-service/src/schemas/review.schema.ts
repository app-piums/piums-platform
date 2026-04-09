import { z } from "zod";

const MIN_RATING = parseInt(process.env.MIN_RATING || "1");
const MAX_RATING = parseInt(process.env.MAX_RATING || "5");

// Schema para crear una reseña
export const createReviewSchema = z.object({
  bookingId: z.string().min(1, "bookingId es requerido"),
  rating: z
    .number()
    .int("Rating debe ser un número entero")
    .min(MIN_RATING, `Rating mínimo es ${MIN_RATING}`)
    .max(MAX_RATING, `Rating máximo es ${MAX_RATING}`),
  comment: z
    .string()
    .min(3, "El comentario debe tener al menos 3 caracteres")
    .max(2000, "El comentario no puede exceder 2000 caracteres")
    .optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url("URL de foto inválida"),
        caption: z.string().max(200).optional(),
      })
    )
    .max(parseInt(process.env.MAX_PHOTOS_PER_REVIEW || "5"), "Máximo 5 fotos por reseña")
    .optional(),
});

// Schema para actualizar una reseña
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(MIN_RATING)
    .max(MAX_RATING)
    .optional(),
  comment: z
    .string()
    .min(3, "El comentario debe tener al menos 3 caracteres")
    .max(2000, "El comentario no puede exceder 2000 caracteres")
    .optional(),
});

// Schema para responder a una reseña (artistas)
export const respondReviewSchema = z.object({
  message: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres")
    .max(1000, "La respuesta no puede exceder 1000 caracteres"),
});

// Schema para reportar una reseña
export const reportReviewSchema = z.object({
  reason: z.enum(["SPAM", "OFFENSIVE", "FAKE", "INAPPROPRIATE", "OTHER"]),
  description: z
    .string()
    .min(10, "Por favor describe el motivo del reporte")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
});

// Schema para filtrar reseñas
export const filterReviewsSchema = z.object({
  artistId: z.string().optional(),
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  rating: z.coerce.number().int().min(MIN_RATING).max(MAX_RATING).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]).optional(),
  hasComment: z.coerce.boolean().optional(),
  hasPhotos: z.coerce.boolean().optional(),
  sortBy: z.enum(["recent", "rating_high", "rating_low", "helpful"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Schema para marcar como útil/no útil
export const markHelpfulSchema = z.object({
  isHelpful: z.boolean(),
});
