import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service' }),
  }),
  /** ISO 3166-1 alpha-2 — GDPR / regional routing */
  countryCode: z.string().length(2).toUpperCase().default('IL'),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

/** Cookie-based web refresh, or body token for mobile clients (ADR 002). */
export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .default({});

export const verifyEmailSchema = z.object({
  token: z.string().min(16).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.array(z.string()),
});

export type AuthUserDto = z.infer<typeof authUserSchema>;

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: authUserSchema,
});

export type TokenResponseDto = z.infer<typeof tokenResponseSchema>;
