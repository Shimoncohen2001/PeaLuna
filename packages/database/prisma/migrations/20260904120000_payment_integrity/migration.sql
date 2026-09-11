-- Escrow claim state + voided authorizations + Stripe webhook journal

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'UNPAID',
    'AUTHORIZED',
    'CAPTURING',
    'CAPTURED',
    'REFUNDED',
    'FAILED',
    'VOIDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CAPTURING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VOIDED';

ALTER TABLE "repair_orders"
  ADD COLUMN IF NOT EXISTS "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

CREATE TABLE IF NOT EXISTS "stripe_events" (
  "id" VARCHAR(255) NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);
