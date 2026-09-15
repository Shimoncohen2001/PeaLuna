-- Optional service location for home bookings (distance without exposing live GPS)
ALTER TABLE "repair_orders" ADD COLUMN "service_latitude" DOUBLE PRECISION;
ALTER TABLE "repair_orders" ADD COLUMN "service_longitude" DOUBLE PRECISION;
