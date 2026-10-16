import {
  adminCustomerIdParamsSchema,
  adminCustomersQuerySchema,
  adminDashboardQuerySchema,
  adminExpertIdParamsSchema,
  adminExpertsOverviewQuerySchema,
  adminExpertsQuerySchema,
  successResponse,
} from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireAdmin } from '../../lib/access.js';
import { AdminService } from './admin.service.js';

export async function adminRoutes(app: AppInstance, env: Env): Promise<void> {
  const admin = new AdminService(env);

  app.get(
    `${API_PREFIX}/admin/dashboard`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: adminDashboardQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const dashboard = await admin.dashboard(request.query.period);
      return reply.send(successResponse(dashboard, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/admin/customers`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: adminCustomersQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const customers = await admin.listCustomers(request.query);
      return reply.send(successResponse(customers, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/admin/customers/:id`,
    {
      preHandler: [app.authenticate],
      schema: { params: adminCustomerIdParamsSchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const customer = await admin.getCustomer(request.params.id);
      return reply.send(successResponse(customer, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/admin/experts/overview`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: adminExpertsOverviewQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const overview = await admin.expertsOverview(request.query.period);
      return reply.send(successResponse(overview, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/admin/experts`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: adminExpertsQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const experts = await admin.listExperts(request.query);
      return reply.send(successResponse(experts, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/admin/experts/:id`,
    {
      preHandler: [app.authenticate],
      schema: { params: adminExpertIdParamsSchema, querystring: adminExpertsOverviewQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const expert = await admin.getExpert(request.params.id, request.query.period);
      return reply.send(successResponse(expert, request.requestId));
    },
  );
}
