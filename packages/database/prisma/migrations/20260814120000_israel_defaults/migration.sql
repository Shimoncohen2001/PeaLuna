-- Israel marketplace defaults
ALTER TABLE "users" ALTER COLUMN "country_code" SET DEFAULT 'IL';
ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'he-IL';
ALTER TABLE "users" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Jerusalem';

ALTER TABLE "service_types" ALTER COLUMN "currency" SET DEFAULT 'ILS';
ALTER TABLE "repair_orders" ALTER COLUMN "currency" SET DEFAULT 'ILS';
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'ILS';
ALTER TABLE "platform_commissions" ALTER COLUMN "currency" SET DEFAULT 'ILS';

UPDATE "service_types" SET "currency" = 'ILS';
UPDATE "repair_orders" SET "currency" = 'ILS';
UPDATE "transactions" SET "currency" = 'ILS';
UPDATE "platform_commissions" SET "currency" = 'ILS';
