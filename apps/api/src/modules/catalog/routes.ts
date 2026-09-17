import {
  paginationQuerySchema,
  reorderWorkflowStepsSchema,
  saveOrderWorkflowSchema,
  successResponse,
  updateSkillSchema,
  updateWorkflowStepSchema,
  upsertSkillSchema,
  upsertWorkflowStepSchema,
} from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireAdmin, requireApprovedTechnicianProfile, requireUser } from '../../lib/access.js';
import { CatalogService } from './catalog.service.js';
import { prisma } from '@velure/database';

export async function catalogRoutes(app: AppInstance): Promise<void> {
  const catalog = new CatalogService();

  app.get(`${API_PREFIX}/skills`, async (request, reply) => {
    const skills = await catalog.listSkills(false);
    return reply.send(successResponse(skills, request.requestId));
  });

  app.get(
    `${API_PREFIX}/admin/skills`,
    { preHandler: [app.authenticate], schema: { querystring: paginationQuerySchema } },
    async (request, reply) => {
      requireAdmin(request);
      const skills = await catalog.listSkills(true);
      return reply.send(successResponse(skills, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/admin/skills`,
    { preHandler: [app.authenticate], schema: { body: upsertSkillSchema } },
    async (request, reply) => {
      requireAdmin(request);
      const skill = await catalog.createSkill(request.body);
      return reply.status(201).send(successResponse(skill, request.requestId));
    },
  );

  app.patch(
    `${API_PREFIX}/admin/skills/:id`,
    { preHandler: [app.authenticate], schema: { body: updateSkillSchema } },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const skill = await catalog.updateSkill(id, request.body);
      return reply.send(successResponse(skill, request.requestId));
    },
  );

  app.delete(
    `${API_PREFIX}/admin/skills/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const skill = await catalog.deleteSkill(id);
      return reply.send(successResponse(skill, request.requestId));
    },
  );

  app.get(`${API_PREFIX}/workflow-steps`, async (request, reply) => {
    const steps = await catalog.listWorkflowSteps(false);
    return reply.send(successResponse(steps, request.requestId));
  });

  app.get(
    `${API_PREFIX}/admin/workflow-steps`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const steps = await catalog.listWorkflowSteps(true);
      return reply.send(successResponse(steps, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/admin/workflow-steps`,
    { preHandler: [app.authenticate], schema: { body: upsertWorkflowStepSchema } },
    async (request, reply) => {
      requireAdmin(request);
      const step = await catalog.createWorkflowStep(request.body);
      return reply.status(201).send(successResponse(step, request.requestId));
    },
  );

  app.put(
    `${API_PREFIX}/admin/workflow-steps/reorder`,
    { preHandler: [app.authenticate], schema: { body: reorderWorkflowStepsSchema } },
    async (request, reply) => {
      requireAdmin(request);
      const steps = await catalog.reorderWorkflowSteps(request.body.ids);
      return reply.send(successResponse(steps, request.requestId));
    },
  );

  app.patch(
    `${API_PREFIX}/admin/workflow-steps/:id`,
    { preHandler: [app.authenticate], schema: { body: updateWorkflowStepSchema } },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const step = await catalog.updateWorkflowStep(id, request.body);
      return reply.send(successResponse(step, request.requestId));
    },
  );

  app.delete(
    `${API_PREFIX}/admin/workflow-steps/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const step = await catalog.deleteWorkflowStep(id);
      return reply.send(successResponse(step, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/orders/:id/workflow`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireApprovedTechnicianProfile(user.sub);
      const { id } = request.params as { id: string };
      const order = await prisma.repairOrder.findFirst({
        where: { id, technicianId: profile.id },
        select: { id: true },
      });
      if (!order) throw app.httpErrors.notFound('Order not found');
      const steps = await catalog.listOrderWorkflow(id);
      return reply.send(successResponse(steps, request.requestId));
    },
  );

  app.put(
    `${API_PREFIX}/technicians/me/orders/:id/workflow`,
    {
      preHandler: [app.authenticate],
      schema: { body: saveOrderWorkflowSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireApprovedTechnicianProfile(user.sub);
      const { id } = request.params as { id: string };
      const order = await prisma.repairOrder.findFirst({
        where: { id, technicianId: profile.id },
        select: { id: true, status: true },
      });
      if (!order) throw app.httpErrors.notFound('Order not found');
      if (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'ARCHIVED') {
        throw app.httpErrors.conflict('This job is already closed');
      }
      const steps = await catalog.saveOrderWorkflow(id, request.body);
      return reply.send(successResponse(steps, request.requestId));
    },
  );
}
