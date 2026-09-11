import { z } from 'zod';

export const createWigSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  brand: z.string().max(100).trim().optional(),
  capSize: z.string().max(50).trim().optional(),
  fiberType: z.string().max(50).trim().optional(),
  color: z.string().max(100).trim().optional(),
  lengthCm: z.number().int().min(1).max(200).optional(),
  conditionNotes: z.string().max(2000).trim().optional(),
});

export const updateWigSchema = createWigSchema.partial();

export const wigSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().optional(),
  name: z.string(),
  brand: z.string().nullable(),
  capSize: z.string().nullable(),
  fiberType: z.string().nullable(),
  color: z.string().nullable(),
  lengthCm: z.number().int().nullable(),
  conditionNotes: z.string().nullable(),
  currentCondition: z.string().nullable().optional(),
  currentWeightGrams: z.number().int().nullable().optional(),
  lastCareAt: z.string().datetime().nullable().optional(),
  lastTechnicianName: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  attachmentCount: z.number().int().nonnegative().optional(),
});

export type CreateWigInput = z.infer<typeof createWigSchema>;
export type UpdateWigInput = z.infer<typeof updateWigSchema>;
export type WigDto = z.infer<typeof wigSchema>;
