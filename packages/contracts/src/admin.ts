import { z } from 'zod';

export const adminDashboardPeriodSchema = z.enum(['7', '30', '90', '365', 'all']).default('30');

export const adminDashboardQuerySchema = z.object({
  period: adminDashboardPeriodSchema,
});

export type AdminDashboardPeriod = z.infer<typeof adminDashboardPeriodSchema>;
export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
