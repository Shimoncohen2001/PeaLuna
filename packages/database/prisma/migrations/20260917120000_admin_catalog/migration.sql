-- Admin-configurable skills (Pro expertise) and job completion workflow steps.

CREATE TYPE "WorkflowStepInputKind" AS ENUM ('CHECK', 'TEXT');

CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");
CREATE INDEX "skills_is_active_sort_order_idx" ON "skills"("is_active", "sort_order");

CREATE TABLE "technician_skills" (
    "technician_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technician_skills_pkey" PRIMARY KEY ("technician_id", "skill_id")
);

CREATE INDEX "technician_skills_skill_id_idx" ON "technician_skills"("skill_id");

ALTER TABLE "technician_skills"
    ADD CONSTRAINT "technician_skills_technician_id_fkey"
    FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technician_skills"
    ADD CONSTRAINT "technician_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workflow_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "input_kind" "WorkflowStepInputKind" NOT NULL DEFAULT 'CHECK',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workflow_steps_slug_key" ON "workflow_steps"("slug");
CREATE INDEX "workflow_steps_is_active_sort_order_idx" ON "workflow_steps"("is_active", "sort_order");

CREATE TABLE "order_workflow_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "step_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "note" VARCHAR(2000),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_workflow_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_workflow_progress_order_id_step_id_key" ON "order_workflow_progress"("order_id", "step_id");
CREATE INDEX "order_workflow_progress_order_id_idx" ON "order_workflow_progress"("order_id");

ALTER TABLE "order_workflow_progress"
    ADD CONSTRAINT "order_workflow_progress_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_workflow_progress"
    ADD CONSTRAINT "order_workflow_progress_step_id_fkey"
    FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
