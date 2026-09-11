import { z } from 'zod';

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export interface ApiResponse<T> {
  data: T | null;
  meta: {
    requestId: string;
    pagination?: ReturnType<typeof import('./pagination.js').paginationMeta>;
  };
  error: ApiError | null;
}

export function successResponse<T>(
  data: T,
  requestId: string,
  meta?: ApiResponse<T>['meta']['pagination'],
): ApiResponse<T> {
  return {
    data,
    meta: { requestId, ...(meta ? { pagination: meta } : {}) },
    error: null,
  };
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Record<string, unknown>,
): ApiResponse<null> {
  return {
    data: null,
    meta: { requestId },
    error: { code, message, details },
  };
}
