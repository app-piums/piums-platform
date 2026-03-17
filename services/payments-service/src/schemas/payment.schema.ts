import { z } from "zod";

// ==================== CREATE PAYMENT INTENT ====================

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("GTQ"),
  description: z.string().optional(),
  paymentMethods: z.array(z.string()).default(["card"]),
  metadata: z.record(z.any()).optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

// ==================== CONFIRM PAYMENT ====================

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

// ==================== CREATE REFUND ====================

export const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().int().positive().optional(), // Si no se proporciona, reembolso completo
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

// ==================== SEARCH PAYMENTS ====================

export const searchPaymentsSchema = z.object({
  userId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "SUCCEEDED",
    "FAILED",
    "CANCELLED",
    "PARTIALLY_REFUNDED",
    "FULLY_REFUNDED",
  ]).optional(),
  paymentType: z.enum(["DEPOSIT", "FULL_PAYMENT", "REMAINING", "REFUND"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
});

export type SearchPaymentsInput = z.infer<typeof searchPaymentsSchema>;

// ==================== ADD PAYMENT METHOD ====================

export const addPaymentMethodSchema = z.object({
  stripePaymentMethodId: z.string(),
  setAsDefault: z.boolean().default(false),
});

export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;

// ==================== WEBHOOK SIGNATURE ====================

export const webhookSignatureSchema = z.object({
  signature: z.string(),
  payload: z.string(),
});

export type WebhookSignatureInput = z.infer<typeof webhookSignatureSchema>;
