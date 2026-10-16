import { z } from 'zod';

export const adminDashboardPeriodSchema = z.enum(['7', '30', '90', '365', 'all']).default('30');

export const adminDashboardQuerySchema = z.object({
  period: adminDashboardPeriodSchema,
});

export const adminCustomerSortBySchema = z.enum(['createdAt', 'bookings', 'spent']);
export const adminCustomerStatusFilterSchema = z.enum([
  'all',
  'ACTIVE',
  'PENDING_VERIFICATION',
  'SUSPENDED',
]);
export const adminCustomerActivityFilterSchema = z.enum(['all', 'booked', 'none']);

export const adminCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  sortBy: adminCustomerSortBySchema.default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: adminCustomerStatusFilterSchema.default('all'),
  activity: adminCustomerActivityFilterSchema.default('all'),
});

export const adminCustomerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type AdminDashboardPeriod = z.infer<typeof adminDashboardPeriodSchema>;
export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
export type AdminCustomersQuery = z.infer<typeof adminCustomersQuerySchema>;
export type AdminCustomerSortBy = z.infer<typeof adminCustomerSortBySchema>;
