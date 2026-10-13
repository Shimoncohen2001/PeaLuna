import { adminDashboardQuerySchema, successResponse } from '@velure/contracts';
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
}
