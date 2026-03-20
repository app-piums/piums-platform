import { z } from 'zod';

// Enums
export const NotificationTypeEnum = z.enum([
  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'BOOKING_REMINDER_24H',
  'BOOKING_REMINDER_2H',
  'BOOKING_COMPLETED',
  'BOOKING_NO_SHOW',
  'PAYMENT_RECEIVED',
  'PAYMENT_REMINDER',
  'PAYMENT_REFUNDED',
  'REVIEW_REQUEST',
  'REVIEW_RECEIVED',
  'MESSAGE_RECEIVED',
  'SYSTEM_NOTIFICATION',
  'MARKETING',
]);

export const NotificationChannelEnum = z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']);

export const NotificationStatusEnum = z.enum([
  'PENDING',
  'SCHEDULED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'READ',
]);

// Send notification schema
export const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: NotificationTypeEnum,
  channel: NotificationChannelEnum,
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  emailTo: z.string().email().optional(),
  emailSubject: z.string().optional(),
  emailHtml: z.string().optional(),
  phoneNumber: z.string().optional(),
  fcmToken: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
  templateId: z.string().uuid().optional(),
});

// Batch send schema
export const batchSendSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(1000),
  type: NotificationTypeEnum,
  channel: NotificationChannelEnum,
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
  templateId: z.string().uuid().optional(),
});

// Send from template schema
export const sendFromTemplateSchema = z.object({
  userId: z.string().uuid(),
  templateKey: z.string(),
  channel: NotificationChannelEnum,
  variables: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
});

// Create template schema
export const createTemplateSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: NotificationTypeEnum,
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  emailSubject: z.string().optional(),
  emailHtml: z.string().optional(),
  variables: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
});

// Update template schema
export const updateTemplateSchema = createTemplateSchema.partial().omit({ key: true });

// User preferences schema
export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  bookingNotifications: z.boolean().optional(),
  paymentNotifications: z.boolean().optional(),
  reviewNotifications: z.boolean().optional(),
  marketingNotifications: z.boolean().optional(),
  dndEnabled: z.boolean().optional(),
  dndStartHour: z.number().int().min(0).max(23).optional(),
  dndEndHour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  fcmTokens: z.array(z.string()).optional(),
});

// Search notifications schema
export const searchNotificationsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: NotificationTypeEnum.optional(),
  channel: NotificationChannelEnum.optional(),
  status: NotificationStatusEnum.optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Mark as read schema
export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type BatchSendInput = z.infer<typeof batchSendSchema>;
export type SendFromTemplateInput = z.infer<typeof sendFromTemplateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type SearchNotificationsInput = z.infer<typeof searchNotificationsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
