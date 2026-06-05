import { z } from "zod";

const CONTENT_TYPES = [
  "MESSAGE",
  "REVIEW",
  "REVIEW_RESPONSE",
  "USER_BIO",
  "ARTIST_BIO",
  "EVENT_DESCRIPTION",
  "BOOKING_NOTE",
  "USERNAME",
] as const;

const CATEGORIES = [
  "PROFANITY",
  "HATE_SPEECH",
  "SEXUAL",
  "VIOLENCE",
  "THREAT",
  "SPAM",
  "DISCRIMINATION",
] as const;

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

// Moderación de contenido (uso interno)
export const checkContentSchema = z.object({
  userId: z.string().min(1, "userId requerido"),
  contentType: z.enum(CONTENT_TYPES, { errorMap: () => ({ message: "contentType inválido" }) }),
  content: z.string().min(1, "content requerido").max(10_000, "content demasiado largo"),
  service: z.string().min(1, "service requerido"),
});

// Agregar palabra al blacklist
export const createWordSchema = z.object({
  word: z.string().min(1).max(200).transform((w) => w.toLowerCase().trim()),
  language: z.string().default("es"),
  category: z.enum(CATEGORIES),
  severity: z.enum(SEVERITIES),
  variations: z.boolean().default(true),
  partialMatch: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

// Actualizar palabra del blacklist
export const updateWordSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  active: z.boolean().optional(),
  variations: z.boolean().optional(),
  partialMatch: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

// Filtros para listar palabras del blacklist
export const listWordsSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  active: z
    .string()
    .transform((v) => (v === "false" ? false : v === "true" ? true : undefined))
    .optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// Filtros para logs de moderación
export const listLogsSchema = z.object({
  userId: z.string().optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Resolver revisión manual
export const resolveReviewSchema = z.object({
  note: z.string().max(1000).optional(),
});

// Resolver strike
export const resolveStrikeSchema = z.object({
  note: z.string().max(1000).optional(),
});

// Test de contenido
export const testContentSchema = z.object({
  content: z.string().min(1).max(10_000),
});
