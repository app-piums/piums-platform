import { z } from "zod";

// ==================== BOOKING RESCHEDULE ====================

export const rescheduleBookingSchema = z.object({
  newDate: z.string().datetime(), // ISO 8601 format
  newTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in HH:mm format (24-hour)",
  }),
  reason: z.string().optional(),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
