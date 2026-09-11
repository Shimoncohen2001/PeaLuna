import { saveCareReportSchema, successResponse } from '@velure/contracts';
import { prisma } from '@velure/database';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireCustomerProfile, requireUser } from '../../lib/access.js';
import { CareReportService } from './care-report.service.js';

export async function careReportRoutes(app: AppInstance, env: Env): Promise<void> {
  const care = new CareReportService(env);

  app.get(
    `${API_PREFIX}/technicians/me/orders/:id/care-report`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const report = await care.getOrCreateDraft(user.sub, id);
      return reply.send(successResponse(report, request.requestId));
    },
  );

  app.put(
    `${API_PREFIX}/technicians/me/orders/:id/care-report`,
    {
      preHandler: [app.authenticate],
      schema: { body: saveCareReportSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const report = await care.saveDraft(user.sub, id, request.body);
      return reply.send(successResponse(report, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/technicians/me/orders/:id/care-report/submit`,
    {
      preHandler: [app.authenticate],
      schema: { body: saveCareReportSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const report = await care.submit(user.sub, id, request.body);
      return reply.send(successResponse(report, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/clients`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const clients = await care.listClients(user.sub);
      return reply.send(successResponse(clients, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/clients/:customerId/wigs`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { customerId } = request.params as { customerId: string };
      const wigs = await care.listClientWigs(user.sub, customerId);
      return reply.send(successResponse(wigs, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/wigs/:wigId`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { wigId } = request.params as { wigId: string };
      await care.assertTechnicianWigAccess(user.sub, wigId);
      const overview = await care.getWigOverview(wigId, true);
      return reply.send(successResponse(overview, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/wigs/:id/care-history`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);
      const { id } = request.params as { id: string };
      const wig = await prisma.wigProfile.findFirst({
        where: { id, customerId: profile.id, archivedAt: null },
      });
      if (!wig) {
        throw app.httpErrors.notFound('Wig not found');
      }
      const overview = await care.getWigOverview(id, false);
      return reply.send(successResponse(overview, request.requestId));
    },
  );
}
