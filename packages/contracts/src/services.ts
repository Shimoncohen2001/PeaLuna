import { z } from 'zod';
import { DEFAULT_CURRENCY } from './constants.js';

export const serviceTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable().optional(),
  basePriceCents: z.number().int(),
  currency: z.string(),
  estimatedDays: z.number().int(),
  estimatedMinutes: z.number().int().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean().optional(),
});

export const upsertServiceSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase-kebab-case')
    .optional(),
  description: z.string().max(2000).trim().optional(),
  category: z.string().max(80).trim().optional(),
  basePriceCents: z.number().int().min(0).max(10_000_000),
  currency: z.string().length(3).toUpperCase().default(DEFAULT_CURRENCY),
  estimatedDays: z.number().int().min(0).max(90).default(1),
  estimatedMinutes: z.number().int().min(5).max(24 * 60).default(60),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = upsertServiceSchema.partial();

export type ServiceTypeDto = z.infer<typeof serviceTypeSchema>;
export type UpsertServiceInput = z.infer<typeof upsertServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
