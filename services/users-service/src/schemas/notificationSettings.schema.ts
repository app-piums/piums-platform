import { z } from 'zod';

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
