import { z } from 'zod';

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export function normalizeAllowedMime(mimeType: string): (typeof ALLOWED_MIME)[number] | null {
  const mime = mimeType.trim().toLowerCase();
  if (mime === 'image/jpg' || mime === 'image/pjpeg') return 'image/jpeg';
  if (mime === 'image/heic-sequence') return 'image/heic';
  if (mime === 'image/heif-sequence') return 'image/heif';
  return (ALLOWED_MIME as readonly string[]).includes(mime)
    ? (mime as (typeof ALLOWED_MIME)[number])
    : null;
}

const mimeTypeSchema = z
  .string()
  .transform((value, ctx) => {
    const mime = normalizeAllowedMime(value);
    if (!mime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unsupported media type' });
      return z.NEVER;
    }
    return mime;
  });

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const createUploadUrlSchema = z.object({
  wigId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  mimeType: mimeTypeSchema,
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  purpose: z.enum(['INTAKE', 'PROGRESS', 'QC', 'DELIVERY', 'BEFORE_CARE', 'AFTER_CARE', 'OTHER']).default('INTAKE'),
  filename: z.string().min(1).max(255).optional(),
  careReportId: z.string().uuid().optional(),
  photoPhase: z.enum(['BEFORE', 'AFTER']).optional(),
  photoAngle: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE', 'EXTRA']).optional(),
});

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1).max(512),
  wigId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  mimeType: mimeTypeSchema,
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  purpose: z.enum(['INTAKE', 'PROGRESS', 'QC', 'DELIVERY', 'BEFORE_CARE', 'AFTER_CARE', 'OTHER']).default('INTAKE'),
  careReportId: z.string().uuid().optional(),
  photoPhase: z.enum(['BEFORE', 'AFTER']).optional(),
  photoAngle: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE', 'EXTRA']).optional(),
});

export const directUploadSchema = createUploadUrlSchema.extend({
  contentBase64: z.string().min(32).max(70_000_000),
});

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type DirectUploadInput = z.infer<typeof directUploadSchema>;

export const mediaItemSchema = z.object({
  id: z.string().uuid(),
  mimeType: z.string(),
  purpose: z.string(),
  kind: z.enum(['image', 'video']),
  url: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});

export type MediaItemDto = z.infer<typeof mediaItemSchema>;

export { ALLOWED_MIME };
