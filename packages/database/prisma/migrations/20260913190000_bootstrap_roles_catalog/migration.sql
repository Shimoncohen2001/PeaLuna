-- Bootstrap roles, permissions, and Israel catalog so signup works without a manual seed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "roles" ("id", "name", "description")
VALUES
  (gen_random_uuid(), 'CUSTOMER', 'CUSTOMER role'),
  (gen_random_uuid(), 'TECHNICIAN', 'TECHNICIAN role'),
  (gen_random_uuid(), 'OPS', 'OPS role'),
  (gen_random_uuid(), 'ADMIN', 'ADMIN role'),
  (gen_random_uuid(), 'SUPER_ADMIN', 'SUPER_ADMIN role')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "permissions" ("id", "name", "description")
VALUES
  (gen_random_uuid(), 'orders:read:own', 'orders:read:own'),
  (gen_random_uuid(), 'orders:read:assigned', 'orders:read:assigned'),
  (gen_random_uuid(), 'orders:update:own', 'orders:update:own'),
  (gen_random_uuid(), 'orders:update:assigned', 'orders:update:assigned'),
  (gen_random_uuid(), 'orders:read:all', 'orders:read:all'),
  (gen_random_uuid(), 'orders:manage', 'orders:manage'),
  (gen_random_uuid(), 'technicians:read', 'technicians:read'),
  (gen_random_uuid(), 'technicians:approve', 'technicians:approve'),
  (gen_random_uuid(), 'users:manage', 'users:manage'),
  (gen_random_uuid(), 'analytics:read', 'analytics:read'),
  (gen_random_uuid(), 'commission:manage', 'commission:manage'),
  (gen_random_uuid(), 'catalog:manage', 'catalog:manage')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
JOIN "permissions" p ON (
  (r.name = 'CUSTOMER' AND p.name IN ('orders:read:own', 'orders:update:own'))
  OR (r.name = 'TECHNICIAN' AND p.name IN ('orders:read:assigned', 'orders:update:assigned', 'technicians:read'))
  OR (r.name = 'OPS' AND p.name IN ('orders:read:all', 'orders:manage', 'technicians:read', 'analytics:read'))
  OR (r.name = 'ADMIN' AND p.name IN (
    'orders:read:all', 'orders:manage', 'technicians:read', 'technicians:approve',
    'users:manage', 'analytics:read', 'commission:manage', 'catalog:manage'
  ))
  OR (r.name = 'SUPER_ADMIN')
)
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "service_types" (
  "id", "slug", "name", "description", "category", "base_price_cents",
  "currency", "estimated_days", "estimated_minutes", "is_active", "sort_order",
  "created_at", "updated_at"
)
VALUES
  (gen_random_uuid(), 'comble-trou', 'תיקון חור', 'תיקון חורים ואזורים פגומים בלייס או בבסיס', 'תיקון', 18000, 'ILS', 1, 45, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'couper-lace', 'חיתוך לייס', 'חיתוך מקצועי של הלייס למראה טבעי', 'תיקון', 12000, 'ILS', 1, 30, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'baby-hair', 'בייבי הייר', 'יצירה ועיצוב בייבי הייר', 'עיצוב', 15000, 'ILS', 1, 40, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'lavage-brushing-soin', 'שטיפה / בראשינג / טיפול', 'שטיפה, טיפול לחות ובראשינג מקצועי', 'טיפול', 22000, 'ILS', 1, 90, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'couleur', 'צבע', 'צביעה, באליאז׳ או תיקון צבע', 'צבע', 32000, 'ILS', 1, 120, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'transformation-lace', 'המרה לפאה לייס', 'המרה מלאה של פאה קלאסית ללייס', 'המרה', 65000, 'ILS', 3, 180, true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
