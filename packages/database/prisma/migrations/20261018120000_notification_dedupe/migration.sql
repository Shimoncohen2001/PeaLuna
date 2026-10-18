ALTER TABLE "notifications" ADD COLUMN "type" VARCHAR(50) NOT NULL DEFAULT 'GENERIC';
ALTER TABLE "notifications" ADD COLUMN "entity_id" UUID;

CREATE UNIQUE INDEX "notifications_dedupe" ON "notifications"("user_id", "channel", "type", "entity_id");
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
