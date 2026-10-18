import { z } from 'zod';
import { paginationQuerySchema } from './pagination.js';

export const notificationTypeSchema = z.enum(['GENERIC', 'BOOKING_REQUEST']);

export const notificationDtoSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  payload: z.record(z.unknown()).nullable(),
});

export const notificationListQuerySchema = paginationQuerySchema.pick({
  page: true,
  limit: true,
});

export type NotificationDto = z.infer<typeof notificationDtoSchema>;
