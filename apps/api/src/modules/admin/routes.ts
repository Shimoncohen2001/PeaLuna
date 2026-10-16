import {
  adminCustomerIdParamsSchema,
  adminCustomersQuerySchema,
  adminDashboardQuerySchema,
  successResponse,
} from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireAdmin } from '../../lib/access.js';
import { AdminService } from './admin.service.js';

export async function adminRoutes(app: AppInstance): Promise<void> {
  const admin = new AdminService();

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
}
