import { z } from 'zod';
import { paginationQuerySchema } from './pagination.js';

export const technicianApplySchema = z.object({
  displayName: z.string().min(2).max(120).trim(),
  headline: z.string().max(200).trim().optional(),
  bio: z.string().max(2000).trim().optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  serviceCity: z.string().min(2).max(100).trim(),
  servicePostalCode: z.string().min(4).max(12).trim(),
  serviceCountryCode: z.string().length(2).toUpperCase().default('IL'),
  salonAddress: z.string().max(255).trim().optional(),
  offersHomeService: z.boolean().default(true),
  offersSalonService: z.boolean().default(true),
  acceptsCashPayment: z.boolean().default(false),
  serviceTypeIds: z.array(z.string().uuid()).min(1).max(20),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const technicianUpdateSchema = technicianApplySchema.partial().omit({ serviceTypeIds: true }).extend({
  serviceTypeIds: z.array(z.string().uuid()).min(1).max(20).optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});

export const setAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema).max(21),
});

export const technicianSearchQuerySchema = z.object({
  postalCode: z.string().max(12).optional(),
  city: z.string().max(100).optional(),
  serviceTypeId: z.string().uuid().optional(),
  venue: z.enum(['HOME', 'SALON']).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(250).default(80),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createBookingSchema = z
  .object({
    technicianId: z.string().uuid(),
    wigId: z.string().uuid(),
    serviceTypeIds: z.array(z.string().uuid()).min(1).max(10),
    scheduledAt: z.string().datetime(),
    venueType: z.enum(['HOME', 'SALON']),
    serviceAddressLine: z.string().max(255).trim().optional(),
    serviceCity: z.string().max(100).trim().optional(),
    servicePostalCode: z.string().max(12).trim().optional(),
    serviceLatitude: z.number().min(-90).max(90).optional(),
    serviceLongitude: z.number().min(-180).max(180).optional(),
    customerNotes: z.string().max(2000).trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.venueType === 'HOME' && !value.serviceAddressLine) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['serviceAddressLine'],
        message: 'Home service requires an address',
      });
    }
  });

export const technicianStatusSchema = z.enum([
  'PENDING_APPLICATION',
  'UNDER_REVIEW',
  'APPROVED',
  'SUSPENDED',
  'REJECTED',
]);

export const adminTechnicianQuerySchema = paginationQuerySchema.extend({
  status: technicianStatusSchema.optional(),
});

export type TechnicianApplyInput = z.infer<typeof technicianApplySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type TechnicianStatusDto = z.infer<typeof technicianStatusSchema>;
