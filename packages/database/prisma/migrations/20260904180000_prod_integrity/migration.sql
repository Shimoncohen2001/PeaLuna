CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_key" ON "users" (lower("email"));

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "key" VARCHAR(128) NOT NULL,
  "user_id" UUID NOT NULL,
  "method" VARCHAR(16) NOT NULL,
  "path" VARCHAR(255) NOT NULL,
  "request_hash" VARCHAR(64) NOT NULL,
  "status_code" INTEGER NOT NULL,
  "response" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "idempotency_keys_user_id_idx" ON "idempotency_keys"("user_id");
CREATE INDEX IF NOT EXISTS "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- Marketplace columns that existed in Prisma schema but were never migrated.
DO $$ BEGIN
  CREATE TYPE "ServiceVenue" AS ENUM ('HOME', 'SALON');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "repair_orders"
  ADD COLUMN IF NOT EXISTS "venue_type" "ServiceVenue",
  ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "service_address_line" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "service_city" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "service_postal_code" VARCHAR(12);

ALTER TABLE "technician_profiles"
  ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "headline" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "service_postal_code" VARCHAR(12),
  ADD COLUMN IF NOT EXISTS "salon_address" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "offers_home_service" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "offers_salon_service" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "review_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "technician_profiles_service_postal_code_idx"
  ON "technician_profiles"("service_postal_code");
CREATE INDEX IF NOT EXISTS "technician_profiles_latitude_longitude_idx"
  ON "technician_profiles"("latitude", "longitude");

ALTER TABLE "service_types"
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "estimated_minutes" INTEGER NOT NULL DEFAULT 60;

CREATE TABLE IF NOT EXISTS "technician_services" (
  "id" UUID NOT NULL,
  "technician_id" UUID NOT NULL,
  "service_type_id" UUID NOT NULL,
  "custom_price_cents" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "technician_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "technician_services_technician_id_service_type_id_key"
  ON "technician_services"("technician_id", "service_type_id");
CREATE INDEX IF NOT EXISTS "technician_services_service_type_id_idx"
  ON "technician_services"("service_type_id");

DO $$ BEGIN
  ALTER TABLE "technician_services"
    ADD CONSTRAINT "technician_services_technician_id_fkey"
    FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "technician_services"
    ADD CONSTRAINT "technician_services_service_type_id_fkey"
    FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- timestamptz + interval is STABLE (DST), so it cannot appear in an index
-- expression. Persist the 1-hour slot and exclude on the stored range.
ALTER TABLE "repair_orders"
  ADD COLUMN IF NOT EXISTS "scheduled_slot" tstzrange;

CREATE OR REPLACE FUNCTION repair_orders_set_scheduled_slot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."scheduled_at" IS NULL THEN
    NEW."scheduled_slot" := NULL;
  ELSE
    NEW."scheduled_slot" := tstzrange(
      NEW."scheduled_at",
      NEW."scheduled_at" + interval '1 hour',
      '[)'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS repair_orders_scheduled_slot_trg ON "repair_orders";
CREATE TRIGGER repair_orders_scheduled_slot_trg
  BEFORE INSERT OR UPDATE OF "scheduled_at"
  ON "repair_orders"
  FOR EACH ROW
  EXECUTE FUNCTION repair_orders_set_scheduled_slot();

UPDATE "repair_orders"
SET "scheduled_at" = "scheduled_at"
WHERE "scheduled_at" IS NOT NULL AND "scheduled_slot" IS NULL;

-- Keep the oldest order when active slots overlap so the exclusion can be added.
UPDATE "repair_orders" AS newer
SET "status" = 'CANCELLED'
FROM "repair_orders" AS older
WHERE newer."technician_id" IS NOT NULL
  AND older."technician_id" = newer."technician_id"
  AND newer."scheduled_slot" IS NOT NULL
  AND older."scheduled_slot" && newer."scheduled_slot"
  AND newer."status" NOT IN ('CANCELLED', 'ARCHIVED')
  AND older."status" NOT IN ('CANCELLED', 'ARCHIVED')
  AND older."id" < newer."id";

DO $$ BEGIN
  ALTER TABLE "repair_orders"
    ADD CONSTRAINT "repair_orders_technician_slot_excl"
    EXCLUDE USING gist (
      "technician_id" WITH =,
      "scheduled_slot" WITH &&
    )
    WHERE ("technician_id" IS NOT NULL AND "scheduled_slot" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'ARCHIVED'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
