-- Cash payments: customer pays the expert directly, expert confirms reception.
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH');

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CASH_PENDING';

ALTER TABLE "repair_orders"
  ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
  ADD COLUMN "cash_confirmed_at" TIMESTAMPTZ;

ALTER TABLE "technician_profiles"
  ADD COLUMN "accepts_cash_payment" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "platform_commissions"
  ADD COLUMN "due_from_technician" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "settled_at" TIMESTAMPTZ;

CREATE INDEX "platform_commissions_due_from_technician_settled_at_idx"
  ON "platform_commissions" ("due_from_technician", "settled_at");
