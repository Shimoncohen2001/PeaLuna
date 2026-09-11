-- Care reports attached to wigs + snapshot fields

CREATE TYPE "WigCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'VERY_DAMAGED');
CREATE TYPE "WearLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE "TangleLevel" AS ENUM ('NONE', 'LIGHT', 'MODERATE', 'SEVERE');
CREATE TYPE "WigKind" AS ENUM ('LACE_FRONT', 'FULL_LACE', 'CLOSURE', 'GLUELESS', 'CLASSIC', 'OTHER');
CREATE TYPE "HairKind" AS ENUM ('HUMAN', 'SYNTHETIC', 'MIXED', 'OTHER');
CREATE TYPE "CareReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE "CarePhotoPhase" AS ENUM ('BEFORE', 'AFTER');
CREATE TYPE "CarePhotoAngle" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE', 'EXTRA');
CREATE TYPE "CareOperationCode" AS ENUM (
  'WASH', 'DEEP_TREATMENT', 'DETANGLE', 'DRY', 'BLOW_DRY', 'STYLE', 'CUT', 'COLOR', 'BLEACH', 'TONER',
  'LACE_REPAIR', 'LACE_REPLACE', 'BASE_REPAIR', 'HAIR_ADD', 'HAIR_REPLACE', 'RECONSTRUCTION',
  'TRANSFORMATION', 'BABY_HAIR', 'KNOT_REPAIR', 'OTHER'
);

ALTER TYPE "AttachmentPurpose" ADD VALUE 'BEFORE_CARE';
ALTER TYPE "AttachmentPurpose" ADD VALUE 'AFTER_CARE';

ALTER TABLE "wig_profiles" ADD COLUMN "reference" VARCHAR(20);
UPDATE "wig_profiles"
SET "reference" = 'WG-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', ''), 1, 10))
WHERE "reference" IS NULL;
ALTER TABLE "wig_profiles" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX "wig_profiles_reference_key" ON "wig_profiles"("reference");

ALTER TABLE "wig_profiles" ADD COLUMN "current_condition" "WigCondition";
ALTER TABLE "wig_profiles" ADD COLUMN "current_weight_grams" INTEGER;
ALTER TABLE "wig_profiles" ADD COLUMN "last_care_at" TIMESTAMPTZ;
ALTER TABLE "wig_profiles" ADD COLUMN "last_technician_name" VARCHAR(120);

ALTER TABLE "wig_attachments" ADD COLUMN "care_report_id" UUID;
ALTER TABLE "wig_attachments" ADD COLUMN "photo_phase" "CarePhotoPhase";
ALTER TABLE "wig_attachments" ADD COLUMN "photo_angle" "CarePhotoAngle";

CREATE TABLE "care_reports" (
  "id" UUID NOT NULL,
  "wig_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "technician_id" UUID NOT NULL,
  "status" "CareReportStatus" NOT NULL DEFAULT 'DRAFT',
  "submitted_at" TIMESTAMPTZ,
  "before_general_condition" "WigCondition",
  "before_weight_grams" INTEGER,
  "wig_age_years" INTEGER,
  "wig_kind" "WigKind",
  "hair_kind" "HairKind",
  "length_cm" INTEGER,
  "color" VARCHAR(100),
  "lace_condition" "WigCondition",
  "base_condition" "WigCondition",
  "hair_condition" "WigCondition",
  "wear_level" "WearLevel",
  "tangle_level" "TangleLevel",
  "hair_loss_observed" BOOLEAN,
  "visible_damage" TEXT,
  "repairs_needed" TEXT,
  "before_internal_notes" TEXT,
  "hair_added" BOOLEAN NOT NULL DEFAULT false,
  "added_hair_kind" "HairKind",
  "added_hair_grams" INTEGER,
  "added_hair_length_cm" INTEGER,
  "added_hair_color" VARCHAR(100),
  "added_hair_texture" VARCHAR(100),
  "added_hair_origin" VARCHAR(120),
  "added_hair_zone" VARCHAR(150),
  "added_hair_comment" TEXT,
  "after_weight_grams" INTEGER,
  "after_general_condition" "WigCondition",
  "after_hair_condition" "WigCondition",
  "after_lace_condition" "WigCondition",
  "after_base_condition" "WigCondition",
  "after_wear_level" "WearLevel",
  "result_notes" TEXT,
  "remaining_issues" TEXT,
  "after_internal_notes" TEXT,
  "wash_frequency" VARCHAR(120),
  "recommended_products" TEXT,
  "products_to_avoid" TEXT,
  "styling_advice" TEXT,
  "storage_advice" TEXT,
  "heat_advice" TEXT,
  "lace_advice" TEXT,
  "next_care_at" TIMESTAMPTZ,
  "other_advice" TEXT,
  "technician_display_name" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "care_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "care_reports_order_id_key" ON "care_reports"("order_id");
CREATE INDEX "care_reports_wig_id_submitted_at_idx" ON "care_reports"("wig_id", "submitted_at");
CREATE INDEX "care_reports_technician_id_idx" ON "care_reports"("technician_id");

CREATE TABLE "care_operations" (
  "id" UUID NOT NULL,
  "report_id" UUID NOT NULL,
  "code" "CareOperationCode" NOT NULL,
  "note" VARCHAR(500),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_operations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "care_operations_report_id_code_key" ON "care_operations"("report_id", "code");
CREATE INDEX "care_operations_report_id_idx" ON "care_operations"("report_id");

ALTER TABLE "care_reports" ADD CONSTRAINT "care_reports_wig_id_fkey" FOREIGN KEY ("wig_id") REFERENCES "wig_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_reports" ADD CONSTRAINT "care_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_reports" ADD CONSTRAINT "care_reports_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_operations" ADD CONSTRAINT "care_operations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "care_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wig_attachments" ADD CONSTRAINT "wig_attachments_care_report_id_fkey" FOREIGN KEY ("care_report_id") REFERENCES "care_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "wig_attachments_care_report_id_idx" ON "wig_attachments"("care_report_id");
