import { prisma } from '@velure/database';
import type {
  SaveOrderWorkflowInput,
  UpdateSkillInput,
  UpdateWorkflowStepInput,
  UpsertSkillInput,
  UpsertWorkflowStepInput,
} from '@velure/contracts';
import { slugify } from '../../lib/slugify.js';

function httpError(message: string, statusCode: number, code: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

async function uniqueSlug(
  table: 'skill' | 'workflowStep' | 'serviceType',
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base;
  for (let i = 0; i < 8; i += 1) {
    const existing =
      table === 'skill'
        ? await prisma.skill.findUnique({ where: { slug } })
        : table === 'workflowStep'
          ? await prisma.workflowStep.findUnique({ where: { slug } })
          : await prisma.serviceType.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base.slice(0, 70)}-${Date.now().toString(36)}`;
  }
  return `${base.slice(0, 60)}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapSkill(s: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  };
}

function mapStep(s: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
  inputKind: 'CHECK' | 'TEXT';
}) {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    sortOrder: s.sortOrder,
    isRequired: s.isRequired,
    isActive: s.isActive,
    inputKind: s.inputKind,
  };
}

export class CatalogService {
  async listSkills(includeInactive: boolean) {
    const where = includeInactive ? {} : { isActive: true };
    const rows = await prisma.skill.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapSkill);
  }

  async createSkill(input: UpsertSkillInput) {
    const slug = await uniqueSlug('skill', input.slug ?? slugify(input.name, 'skill'));
    const skill = await prisma.skill.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });
    return mapSkill(skill);
  }

  async updateSkill(id: string, input: UpdateSkillInput) {
    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) throw httpError('Skill not found', 404, 'SKILL_NOT_FOUND');
    const slug = input.slug
      ? await uniqueSlug('skill', input.slug, id)
      : undefined;
    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        slug,
      },
    });
    return mapSkill(skill);
  }

  async deleteSkill(id: string) {
    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) throw httpError('Skill not found', 404, 'SKILL_NOT_FOUND');
    const used = await prisma.technicianSkill.count({ where: { skillId: id } });
    if (used > 0) {
      const skill = await prisma.skill.update({
        where: { id },
        data: { isActive: false },
      });
      return mapSkill(skill);
    }
    await prisma.skill.delete({ where: { id } });
    return mapSkill(existing);
  }

  async listWorkflowSteps(includeInactive: boolean) {
    const where = includeInactive ? {} : { isActive: true };
    const rows = await prisma.workflowStep.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return rows.map(mapStep);
  }

  async createWorkflowStep(input: UpsertWorkflowStepInput) {
    const slug = await uniqueSlug(
      'workflowStep',
      input.slug ?? slugify(input.title, 'step'),
    );
    const step = await prisma.workflowStep.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder,
        isRequired: input.isRequired,
        isActive: input.isActive,
        inputKind: input.inputKind,
      },
    });
    return mapStep(step);
  }

  async updateWorkflowStep(id: string, input: UpdateWorkflowStepInput) {
    const existing = await prisma.workflowStep.findUnique({ where: { id } });
    if (!existing) throw httpError('Workflow step not found', 404, 'WORKFLOW_STEP_NOT_FOUND');
    const slug = input.slug
      ? await uniqueSlug('workflowStep', input.slug, id)
      : undefined;
    const step = await prisma.workflowStep.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder,
        isRequired: input.isRequired,
        isActive: input.isActive,
        inputKind: input.inputKind,
        slug,
      },
    });
    return mapStep(step);
  }

  async deleteWorkflowStep(id: string) {
    const existing = await prisma.workflowStep.findUnique({ where: { id } });
    if (!existing) throw httpError('Workflow step not found', 404, 'WORKFLOW_STEP_NOT_FOUND');
    const used = await prisma.orderWorkflowProgress.count({ where: { stepId: id } });
    if (used > 0) {
      const step = await prisma.workflowStep.update({
        where: { id },
        data: { isActive: false },
      });
      return mapStep(step);
    }
    await prisma.workflowStep.delete({ where: { id } });
    return mapStep(existing);
  }

  async reorderWorkflowSteps(ids: string[]) {
    const existing = await prisma.workflowStep.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      throw httpError('Unknown workflow step', 400, 'INVALID_WORKFLOW_STEP');
    }
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.workflowStep.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
    return this.listWorkflowSteps(true);
  }

  async listOrderWorkflow(orderId: string) {
    const [steps, progress] = await Promise.all([
      prisma.workflowStep.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.orderWorkflowProgress.findMany({ where: { orderId } }),
    ]);
    const byStep = new Map(progress.map((p) => [p.stepId, p]));
    return steps.map((step) => {
      const row = byStep.get(step.id);
      return {
        ...mapStep(step),
        completed: Boolean(row?.completedAt),
        completedAt: row?.completedAt?.toISOString() ?? null,
        note: row?.note ?? null,
      };
    });
  }

  async saveOrderWorkflow(orderId: string, input: SaveOrderWorkflowInput) {
    const active = await prisma.workflowStep.findMany({
      where: { isActive: true },
    });
    const allowed = new Set(active.map((s) => s.id));
    if (input.steps.some((s) => !allowed.has(s.stepId))) {
      throw httpError('Unknown workflow step', 400, 'INVALID_WORKFLOW_STEP');
    }

    await prisma.$transaction(async (tx) => {
      for (const item of input.steps) {
        await tx.orderWorkflowProgress.upsert({
          where: { orderId_stepId: { orderId, stepId: item.stepId } },
          create: {
            orderId,
            stepId: item.stepId,
            completedAt: item.completed ? new Date() : null,
            note: item.note ?? null,
          },
          update: {
            completedAt: item.completed ? new Date() : null,
            note: item.note ?? null,
          },
        });
      }
    });

    return this.listOrderWorkflow(orderId);
  }

  async assertRequiredComplete(orderId: string) {
    const incomplete = await this.listIncompleteRequired(orderId);
    if (incomplete.length > 0) {
      throw httpError(
        'Complete all required service steps before finishing this job',
        409,
        'WORKFLOW_INCOMPLETE',
      );
    }
  }

  async listIncompleteRequired(orderId: string) {
    const steps = await this.listOrderWorkflow(orderId);
    return steps.filter((step) => step.isRequired && !step.completed);
  }
}
