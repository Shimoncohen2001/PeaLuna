import {
  createReviewSchema,
  paginationMeta,
  paginationQuerySchema,
  successResponse,
} from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { ReviewService } from './review.service.js';

export async function reviewRoutes(app: AppInstance): Promise<void> {
  const reviews = new ReviewService();

  app.post(
    `${API_PREFIX}/orders/:id/reviews`,
    {
      preHandler: [app.authenticate],
      schema: { body: createReviewSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const review = await reviews.createForOrder(id, user.sub, request.body);
      return reply.status(201).send(successResponse(review, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/orders/:id/reviews`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const review = await reviews.getForOrder(id, user.sub);
      return reply.send(successResponse(review, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/reviews`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: paginationQuerySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const { page, limit } = request.query;
      const result = await reviews.listForTechnician(user.sub, page, limit);
      return reply.send(
        successResponse(
          result.reviews,
          request.requestId,
          paginationMeta(result.total, page, limit),
        ),
      );
    },
  );
}
