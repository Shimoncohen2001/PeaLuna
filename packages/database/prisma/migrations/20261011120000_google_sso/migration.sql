ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "auth_identities" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "provider" VARCHAR(32) NOT NULL,
  "provider_subject" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_identities_provider_provider_subject_key"
  ON "auth_identities"("provider", "provider_subject");

CREATE INDEX IF NOT EXISTS "auth_identities_user_id_idx"
  ON "auth_identities"("user_id");

DO $$ BEGIN
  ALTER TABLE "auth_identities"
    ADD CONSTRAINT "auth_identities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
