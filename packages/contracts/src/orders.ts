import { z } from 'zod';

export const orderActionEnum = z.enum([
  'SUBMIT',
  'ASSIGN_TECHNICIAN',
  'ACCEPT',
  'DECLINE',
  'SCHEDULE_PICKUP',
  'CONFIRM_RECEIVED',
  'START_DIAGNOSIS',
  'REQUEST_CUSTOMER_APPROVAL',
  'APPROVE_ESTIMATE',
  'START_REPAIR',
  'SUBMIT_FOR_QC',
  'PASS_QC',
  'MARK_READY',
  'SCHEDULE_DELIVERY',
  'COMPLETE',
  'CANCEL',
  'ARCHIVE',
]);

export const createOrderSchema = z.object({
  wigId: z.string().uuid(),
  serviceTypeIds: z.array(z.string().uuid()).min(1).max(10),
  customerNotes: z.string().max(2000).trim().optional(),
  submit: z.boolean().default(false),
});

export const orderActionSchema = z.object({
  action: orderActionEnum,
  note: z.string().max(1000).trim().optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const orderLineItemSchema = z.object({
  id: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  serviceName: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  lineTotalCents: z.number().int(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.string(),
  version: z.number().int(),
  currency: z.string(),
  subtotalCents: z.number().int(),
  platformFeeCents: z.number().int(),
  totalCents: z.number().int(),
  customerNotes: z.string().nullable(),
  wigId: z.string().uuid(),
  wigName: z.string().optional(),
  paymentStatus: z.string().optional(),
  venueType: z.enum(['HOME', 'SALON']).nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  availableActions: z.array(z.string()).optional(),
  lastAction: z.string().nullable().optional(),
  lineItems: z.array(orderLineItemSchema).optional(),
  hasReview: z.boolean().optional(),
  submittedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderActionInput = z.infer<typeof orderActionSchema>;
export type OrderDto = z.infer<typeof orderSchema>;
