import { z } from 'zod';

export const catalogSlugSchema = z
  .string()
  .min(2)
  .max(100)
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase-kebab-case');

export const skillSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export const upsertSkillSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  slug: catalogSlugSchema.optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const updateSkillSchema = upsertSkillSchema.partial();

export const workflowStepInputKindSchema = z.enum(['CHECK', 'TEXT']);

export const workflowStepSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  isRequired: z.boolean(),
  isActive: z.boolean(),
  inputKind: workflowStepInputKindSchema,
});

export const upsertWorkflowStepSchema = z.object({
  title: z.string().min(2).max(150).trim(),
  slug: catalogSlugSchema.optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  inputKind: workflowStepInputKindSchema.default('CHECK'),
});

export const updateWorkflowStepSchema = upsertWorkflowStepSchema.partial();

export const reorderWorkflowStepsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export const orderWorkflowStepSchema = workflowStepSchema.extend({
  completed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  note: z.string().nullable(),
});

export const saveOrderWorkflowSchema = z.object({
  steps: z
    .array(
      z.object({
        stepId: z.string().uuid(),
        completed: z.boolean(),
        note: z.string().max(2000).trim().optional().nullable(),
      }),
    )
    .max(50),
});

export type SkillDto = z.infer<typeof skillSchema>;
export type UpsertSkillInput = z.infer<typeof upsertSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type WorkflowStepDto = z.infer<typeof workflowStepSchema>;
export type UpsertWorkflowStepInput = z.infer<typeof upsertWorkflowStepSchema>;
export type UpdateWorkflowStepInput = z.infer<typeof updateWorkflowStepSchema>;
export type OrderWorkflowStepDto = z.infer<typeof orderWorkflowStepSchema>;
export type SaveOrderWorkflowInput = z.infer<typeof saveOrderWorkflowSchema>;
