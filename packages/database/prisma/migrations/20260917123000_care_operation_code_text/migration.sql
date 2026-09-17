ALTER TABLE "care_operations" ALTER COLUMN "code" TYPE VARCHAR(80) USING "code"::text;
DROP TYPE "CareOperationCode";
