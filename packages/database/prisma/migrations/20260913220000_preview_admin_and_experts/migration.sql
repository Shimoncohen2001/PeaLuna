-- Make the preview operator an admin and show existing expert applications.

INSERT INTO "user_roles" ("user_id", "role_id")
SELECT u.id, r.id
FROM "users" u
JOIN "roles" r ON r.name IN ('ADMIN', 'TECHNICIAN')
WHERE lower(u.email) = 'shimoncohen524@gmail.com'
ON CONFLICT ("user_id", "role_id") DO NOTHING;

UPDATE "technician_profiles"
SET
  "status" = 'APPROVED',
  "approved_at" = COALESCE("approved_at", CURRENT_TIMESTAMP)
WHERE "status" = 'UNDER_REVIEW';

INSERT INTO "user_roles" ("user_id", "role_id")
SELECT tp.user_id, r.id
FROM "technician_profiles" tp
JOIN "roles" r ON r.name = 'TECHNICIAN'
WHERE tp.status = 'APPROVED'
ON CONFLICT ("user_id", "role_id") DO NOTHING;
