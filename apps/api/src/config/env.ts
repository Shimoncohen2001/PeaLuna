import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECRET: z.string().min(32).optional().or(z.literal('')).transform((v) => v || undefined),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SMTP_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  EMAIL_FROM: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(3).optional()),
  SENTRY_DSN: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  DEPLOYMENT_REGION: z.string().default('eu-central-1'),
  AWS_REGION: z.string().default('eu-central-1'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  /** Directory backing media storage when no object storage is used (Railway volume mount). */
  MEDIA_DIR: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  /** Public web origin for Connect return URLs */
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  /** Private Railway/Cloudflare preview: skip Stripe, S3, SMTP boot checks. */
  PREVIEW_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  const env = result.data;
  if (env.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!env.COOKIE_SECRET) missing.push('COOKIE_SECRET');
    if (!env.COOKIE_SECURE) missing.push('COOKIE_SECURE');
    if (!env.PREVIEW_MODE) {
      if (!env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
      if (!env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
      if (!env.S3_BUCKET && !env.MEDIA_DIR) missing.push('S3_BUCKET or MEDIA_DIR');
      if (!env.SMTP_URL) missing.push('SMTP_URL');
      if (!env.EMAIL_FROM) missing.push('EMAIL_FROM');
    }
    if (missing.length > 0) {
      throw new Error(`Production requires ${missing.join(', ')}`);
    }
  }
  cached = env;
  return cached;
}
