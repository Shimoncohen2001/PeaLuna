import { z } from 'zod';

export const wigConditionEnum = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'VERY_DAMAGED']);
export const wearLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']);
export const tangleLevelEnum = z.enum(['NONE', 'LIGHT', 'MODERATE', 'SEVERE']);
export const wigKindEnum = z.enum(['LACE_FRONT', 'FULL_LACE', 'CLOSURE', 'GLUELESS', 'CLASSIC', 'OTHER']);
export const hairKindEnum = z.enum(['HUMAN', 'SYNTHETIC', 'MIXED', 'OTHER']);
export const carePhotoPhaseEnum = z.enum(['BEFORE', 'AFTER']);
export const carePhotoAngleEnum = z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE', 'EXTRA']);
export const careOperationCodeSchema = z.string().min(1).max(80).trim();

export const HAIR_ADD_CODES = [
  'HAIR_ADD',
  'HAIR_REPLACE',
  'hair-add',
  'hair-replace',
  'ajout-de-cheveux',
  'remplacement-de-cheveux',
] as const;

export const careOperationInputSchema = z.object({
  code: careOperationCodeSchema,
  note: z.string().max(500).trim().optional().nullable(),
});

export const saveCareReportSchema = z.object({
  beforeGeneralCondition: wigConditionEnum.optional().nullable(),
  beforeWeightGrams: z.number().int().min(1).max(2000).optional().nullable(),
  wigAgeYears: z.number().int().min(0).max(40).optional().nullable(),
  wigKind: wigKindEnum.optional().nullable(),
  hairKind: hairKindEnum.optional().nullable(),
  lengthCm: z.number().int().min(1).max(200).optional().nullable(),
  color: z.string().max(100).trim().optional().nullable(),
  laceCondition: wigConditionEnum.optional().nullable(),
  baseCondition: wigConditionEnum.optional().nullable(),
  hairCondition: wigConditionEnum.optional().nullable(),
  wearLevel: wearLevelEnum.optional().nullable(),
  tangleLevel: tangleLevelEnum.optional().nullable(),
  hairLossObserved: z.boolean().optional().nullable(),
  visibleDamage: z.string().max(2000).trim().optional().nullable(),
  repairsNeeded: z.string().max(2000).trim().optional().nullable(),
  beforeInternalNotes: z.string().max(2000).trim().optional().nullable(),
  operations: z.array(careOperationInputSchema).max(20).optional(),
  hairAdded: z.boolean().optional(),
  addedHairKind: hairKindEnum.optional().nullable(),
  addedHairGrams: z.number().int().min(1).max(1000).optional().nullable(),
  addedHairLengthCm: z.number().int().min(1).max(200).optional().nullable(),
  addedHairColor: z.string().max(100).trim().optional().nullable(),
  addedHairTexture: z.string().max(100).trim().optional().nullable(),
  addedHairOrigin: z.string().max(120).trim().optional().nullable(),
  addedHairZone: z.string().max(150).trim().optional().nullable(),
  addedHairComment: z.string().max(2000).trim().optional().nullable(),
  afterWeightGrams: z.number().int().min(1).max(2000).optional().nullable(),
  afterGeneralCondition: wigConditionEnum.optional().nullable(),
  afterHairCondition: wigConditionEnum.optional().nullable(),
  afterLaceCondition: wigConditionEnum.optional().nullable(),
  afterBaseCondition: wigConditionEnum.optional().nullable(),
  afterWearLevel: wearLevelEnum.optional().nullable(),
  resultNotes: z.string().max(2000).trim().optional().nullable(),
  remainingIssues: z.string().max(2000).trim().optional().nullable(),
  afterInternalNotes: z.string().max(2000).trim().optional().nullable(),
  washFrequency: z.string().max(120).trim().optional().nullable(),
  recommendedProducts: z.string().max(2000).trim().optional().nullable(),
  productsToAvoid: z.string().max(2000).trim().optional().nullable(),
  stylingAdvice: z.string().max(2000).trim().optional().nullable(),
  storageAdvice: z.string().max(2000).trim().optional().nullable(),
  heatAdvice: z.string().max(2000).trim().optional().nullable(),
  laceAdvice: z.string().max(2000).trim().optional().nullable(),
  nextCareAt: z.string().datetime().optional().nullable(),
  otherAdvice: z.string().max(2000).trim().optional().nullable(),
});

export type SaveCareReportInput = z.infer<typeof saveCareReportSchema>;
export type CareOperationInput = z.infer<typeof careOperationInputSchema>;
