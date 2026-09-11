import {
  createOrderSchema,
  orderActionSchema,
  paginationMeta,
  paginationQuerySchema,
  successResponse,
} from '@velure/contracts';
import type { OrderAction, Role } from '@velure/domain';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { OrderService } from './order.service.js';
import { PaymentService } from '../payments/payment.service.js';

export async function orderRoutes(app: AppInstance, env: Env): Promise<void> {
  const orders = new OrderService(new PaymentService(env));

  app.get(
    `${API_PREFIX}/orders`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: paginationQuerySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { page, limit } = request.query;
      const { total, orders: rows } = await orders.listForCustomer(user.sub, page, limit);

      return reply.send(
        successResponse(
          rows.map((row) => ({
            id: row.id,
            orderNumber: row.orderNumber,
            status: row.status,
            version: row.version,
            currency: row.currency,
            subtotalCents: row.subtotalCents,
            platformFeeCents: row.platformFeeCents,
            totalCents: row.totalCents,
            customerNotes: row.customerNotes,
            wigId: row.wigId,
            wigName: row.wig.name,
            paymentStatus: row.paymentStatus,
            venueType: row.venueType,
            scheduledAt: row.scheduledAt?.toISOString() ?? null,
            lastAction: row.statusHistory[0]?.action ?? null,
            lineItems: row.lineItems.map((li) => ({
              id: li.id,
              serviceTypeId: li.serviceTypeId,
              serviceName: li.description ?? 'Service',
              quantity: li.quantity,
              unitPriceCents: li.unitPriceCents,
              lineTotalCents: li.totalCents,
            })),
            hasReview: Boolean(row.review),
            submittedAt: row.submittedAt?.toISOString() ?? null,
            completedAt: row.completedAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          })),
          request.requestId,
          paginationMeta(total, page, limit),
        ),
      );
    },
  );

  app.post(
    `${API_PREFIX}/orders`,
    {
      preHandler: [app.authenticate],
      schema: { body: createOrderSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const order = await orders.create({
        userId: user.sub,
        roles: user.roles as Role[],
        wigId: request.body.wigId,
        serviceTypeIds: request.body.serviceTypeIds,
        customerNotes: request.body.customerNotes,
        submit: request.body.submit,
        homeRegion: user.homeRegion || env.DEPLOYMENT_REGION,
      });

      return reply.status(201).send(successResponse(order, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/orders/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const order = await orders.getForUser(id, user.sub, user.roles as Role[]);
      return reply.send(successResponse(order, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/orders/:id/actions`,
    {
      preHandler: [app.authenticate],
      schema: { body: orderActionSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const order = await orders.applyAction({
        orderId: id,
        userId: user.sub,
        roles: user.roles as Role[],
        action: request.body.action as OrderAction,
        note: request.body.note,
        expectedVersion: request.body.expectedVersion,
      });
      return reply.send(successResponse(order, request.requestId));
    },
  );
}
