import {
  adminTechnicianQuerySchema,
  createBookingSchema,
  paginationMeta,
  paginationQuerySchema,
  setAvailabilitySchema,
  successResponse,
  technicianApplySchema,
  technicianSearchQuerySchema,
  technicianUpdateSchema,
} from '@velure/contracts';
import type { Role } from '@velure/domain';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireAdmin, requireUser } from '../../lib/access.js';
import { withIdempotency } from '../../lib/idempotency.js';
import { TechnicianService } from './technician.service.js';
import { listMediaForWigOrder } from '../media/list-for-order.js';

export async function technicianRoutes(app: AppInstance, env: Env): Promise<void> {
  const technicians = new TechnicianService();

  app.get(
    `${API_PREFIX}/technicians`,
    { schema: { querystring: technicianSearchQuerySchema } },
    async (request, reply) => {
      const result = await technicians.search(request.query);
      return reply.send(
        successResponse(
          result.items,
          request.requestId,
          paginationMeta(result.total, request.query.page, request.query.limit),
        ),
      );
    },
  );

  app.post(
    `${API_PREFIX}/technicians/apply`,
    {
      preHandler: [app.authenticate],
      schema: { body: technicianApplySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await technicians.apply(user.sub, request.body);
      return reply.status(201).send(successResponse(profile, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await technicians.getMine(user.sub);
      return reply.send(successResponse(profile, request.requestId));
    },
  );

  app.patch(
    `${API_PREFIX}/technicians/me`,
    {
      preHandler: [app.authenticate],
      schema: { body: technicianUpdateSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await technicians.updateMine(user.sub, request.body);
      return reply.send(successResponse(profile, request.requestId));
    },
  );

  app.put(
    `${API_PREFIX}/technicians/me/availability`,
    {
      preHandler: [app.authenticate],
      schema: { body: setAvailabilitySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await technicians.setAvailability(user.sub, request.body.slots);
      return reply.send(successResponse(profile, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/dashboard`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const dashboard = await technicians.dashboard(user.sub);
      return reply.send(successResponse(dashboard, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/orders`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: paginationQuerySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { page, limit } = request.query;
      const result = await technicians.listAssignedOrders(user.sub, page, limit);
      return reply.send(
        successResponse(result.orders, request.requestId, paginationMeta(result.total, page, limit)),
      );
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/orders/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const job = await technicians.getAssignedOrder(user.sub, id);
      const media = await listMediaForWigOrder(env, job.wig.id, job.id);
      return reply.send(successResponse({ ...job, media }, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/technicians/me/orders/:id/complete`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await technicians.completeAssignedOrder(user.sub, id);
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/technicians/me/orders/:id/accept`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await technicians.respondToAssignment({
        userId: user.sub,
        orderId: id,
        decision: 'ACCEPT',
      });
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/technicians/me/orders/:id/decline`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await technicians.respondToAssignment({
        userId: user.sub,
        orderId: id,
        decision: 'DECLINE',
      });
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.get(`${API_PREFIX}/technicians/:id`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const profile = await technicians.getById(id);
    return reply.send(successResponse(profile, request.requestId));
  });

  app.get(
    `${API_PREFIX}/admin/technicians`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: adminTechnicianQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const { page, limit, status } = request.query;
      const result = await technicians.listForAdmin({ status, page, limit });
      return reply.send(
        successResponse(result.items, request.requestId, paginationMeta(result.total, page, limit)),
      );
    },
  );

  app.post(
    `${API_PREFIX}/admin/technicians/:id/approve`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const result = await technicians.setAdminStatus(id, 'APPROVED');
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/admin/technicians/:id/reject`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const result = await technicians.setAdminStatus(id, 'REJECTED');
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/bookings`,
    {
      preHandler: [app.authenticate],
      schema: { body: createBookingSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const result = await withIdempotency({
        header: request.headers['idempotency-key'],
        requireKey: env.NODE_ENV === 'production',
        userId: user.sub,
        method: 'POST',
        path: `${API_PREFIX}/bookings`,
        body: request.body,
        statusCode: 201,
        execute: () =>
          technicians.createBooking({
            userId: user.sub,
            roles: user.roles as Role[],
            homeRegion: user.homeRegion || env.DEPLOYMENT_REGION,
            input: request.body,
          }),
      });
      return reply.status(result.statusCode).send(successResponse(result.payload, request.requestId));
    },
  );
}
