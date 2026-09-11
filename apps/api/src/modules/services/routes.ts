import {
  paginationMeta,
  paginationQuerySchema,
  successResponse,
  updateServiceSchema,
  upsertServiceSchema,
} from '@velure/contracts';
import { prisma } from '@velure/database';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireAdmin } from '../../lib/access.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || `service-${Date.now().toString(36)}`;
}

function mapService(s: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  basePriceCents: number;
  currency: string;
  estimatedDays: number;
  estimatedMinutes: number;
  sortOrder: number;
  isActive: boolean;
}) {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    basePriceCents: s.basePriceCents,
    currency: s.currency,
    estimatedDays: s.estimatedDays,
    estimatedMinutes: s.estimatedMinutes,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  };
}

export async function serviceRoutes(app: AppInstance): Promise<void> {
  app.get(
    `${API_PREFIX}/services`,
    {
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { page, limit } = request.query;
      const where = { isActive: true };

      const [total, services] = await Promise.all([
        prisma.serviceType.count({ where }),
        prisma.serviceType.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      return reply.send(
        successResponse(
          services.map(mapService),
          request.requestId,
          paginationMeta(total, page, limit),
        ),
      );
    },
  );

  app.get(`${API_PREFIX}/services/:slug`, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const service = await prisma.serviceType.findFirst({
      where: { slug, isActive: true },
    });

    if (!service) {
      throw app.httpErrors.notFound('Service not found');
    }

    return reply.send(successResponse(mapService(service), request.requestId));
  });

  app.get(
    `${API_PREFIX}/admin/services`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: paginationQuerySchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const { page, limit } = request.query;
      const [total, services] = await Promise.all([
        prisma.serviceType.count(),
        prisma.serviceType.findMany({
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      return reply.send(
        successResponse(
          services.map(mapService),
          request.requestId,
          paginationMeta(total, page, limit),
        ),
      );
    },
  );

  app.post(
    `${API_PREFIX}/admin/services`,
    {
      preHandler: [app.authenticate],
      schema: { body: upsertServiceSchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const body = request.body;
      let slug = body.slug ?? slugify(body.name);
      const exists = await prisma.serviceType.findUnique({ where: { slug } });
      if (exists) slug = `${slug}-${Date.now().toString(36)}`;

      const service = await prisma.serviceType.create({
        data: {
          slug,
          name: body.name,
          description: body.description,
          category: body.category,
          basePriceCents: body.basePriceCents,
          currency: body.currency,
          estimatedDays: body.estimatedDays,
          estimatedMinutes: body.estimatedMinutes,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
        },
      });
      return reply.status(201).send(successResponse(mapService(service), request.requestId));
    },
  );

  app.patch(
    `${API_PREFIX}/admin/services/:id`,
    {
      preHandler: [app.authenticate],
      schema: { body: updateServiceSchema },
    },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const existing = await prisma.serviceType.findUnique({ where: { id } });
      if (!existing) throw app.httpErrors.notFound('Service not found');

      const service = await prisma.serviceType.update({
        where: { id },
        data: request.body,
      });
      return reply.send(successResponse(mapService(service), request.requestId));
    },
  );

  app.delete(
    `${API_PREFIX}/admin/services/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      requireAdmin(request);
      const { id } = request.params as { id: string };
      const existing = await prisma.serviceType.findUnique({ where: { id } });
      if (!existing) throw app.httpErrors.notFound('Service not found');
      const service = await prisma.serviceType.update({
        where: { id },
        data: { isActive: false },
      });
      return reply.send(successResponse(mapService(service), request.requestId));
    },
  );
}
