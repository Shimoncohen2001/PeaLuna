import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).trim().optional(),
});

export const reviewSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string().datetime(),
  customerName: z.string().optional(),
  orderNumber: z.string().optional(),
});

/** Public snippet shown when choosing an expert — no order id, last name as initial. */
export const publicReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string().datetime(),
  customerName: z.string(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewDto = z.infer<typeof reviewSchema>;
export type PublicReviewDto = z.infer<typeof publicReviewSchema>;
