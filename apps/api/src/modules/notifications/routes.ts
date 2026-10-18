import { z } from 'zod';
import { notificationListQuerySchema, paginationMeta, successResponse } from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { NotificationService } from './notification.service.js';

const notificationIdParams = z.object({ id: z.string().uuid() });

export async function notificationRoutes(
  app: AppInstance,
  notifications: NotificationService,
): Promise<void> {
  app.get(
    `${API_PREFIX}/notifications`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: notificationListQuerySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { page, limit } = request.query;
      const result = await notifications.listForUser(user.sub, page, limit);
      return reply.send(
        successResponse(result.items, request.requestId, paginationMeta(result.total, page, limit)),
      );
    },
  );

  app.get(
    `${API_PREFIX}/notifications/unread-count`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const unread = await notifications.unreadCount(user.sub);
      return reply.send(successResponse({ unread }, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/notifications/read-all`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const result = await notifications.markAllRead(user.sub);
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/notifications/:id/read`,
    {
      preHandler: [app.authenticate],
      schema: { params: notificationIdParams },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const row = await notifications.markRead(user.sub, request.params.id);
      return reply.send(successResponse(row, request.requestId));
    },
  );
}
