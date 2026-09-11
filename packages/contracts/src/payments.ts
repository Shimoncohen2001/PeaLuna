import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
});

export const paymentStatusSchema = z.enum([
  'UNPAID',
  'AUTHORIZED',
  'CAPTURED',
  'REFUNDED',
  'FAILED',
]);

export type PaymentStatusDto = z.infer<typeof paymentStatusSchema>;
