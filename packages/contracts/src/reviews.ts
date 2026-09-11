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

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewDto = z.infer<typeof reviewSchema>;
