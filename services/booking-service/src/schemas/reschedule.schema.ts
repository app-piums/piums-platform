import { z } from "zod";

// Legacy: direct reschedule without confirmation flow (kept for backward compat)
export const rescheduleBookingSchema = z.object({
  newDate: z.string().datetime(),
  newTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in HH:mm format (24-hour)",
  }),
  reason: z.string().optional(),
});

// New double-confirmation reschedule flow

export const createRescheduleRequestSchema = z.object({
  proposedDate: z.string().datetime(),
  reason: z.string().optional(),
});

export const respondToRescheduleSchema = z.object({
  accept: z.boolean(),
  rejectionReason: z.string().optional(),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type CreateRescheduleRequestInput = z.infer<typeof createRescheduleRequestSchema>;
export type RespondToRescheduleInput = z.infer<typeof respondToRescheduleSchema>;
