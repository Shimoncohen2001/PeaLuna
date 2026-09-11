import {
  createWigSchema,
  paginationMeta,
  paginationQuerySchema,
  successResponse,
  updateWigSchema,
} from '@velure/contracts';
import { prisma } from '@velure/database';
import type { AppInstance } from '../../types/app.js';
import { API_PREFIX } from '../../config/constants.js';
import { generateWigReference, requireCustomerProfile, requireUser } from '../../lib/access.js';

function mapWig(w: {
  id: string;
  reference: string;
  name: string;
  brand: string | null;
  capSize: string | null;
  fiberType: string | null;
  color: string | null;
  lengthCm: number | null;
  conditionNotes: string | null;
  currentCondition: string | null;
  currentWeightGrams: number | null;
  lastCareAt: Date | null;
  lastTechnicianName: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { attachments: number };
}) {
  return {
    id: w.id,
    reference: w.reference,
    name: w.name,
    brand: w.brand,
    capSize: w.capSize,
    fiberType: w.fiberType,
    color: w.color,
    lengthCm: w.lengthCm,
    conditionNotes: w.conditionNotes,
    currentCondition: w.currentCondition,
    currentWeightGrams: w.currentWeightGrams,
    lastCareAt: w.lastCareAt?.toISOString() ?? null,
    lastTechnicianName: w.lastTechnicianName,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    attachmentCount: w._count?.attachments ?? 0,
  };
}

export async function wigRoutes(app: AppInstance): Promise<void> {
  app.get(
    `${API_PREFIX}/wigs`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: paginationQuerySchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);
      const { page, limit } = request.query;

      const where = { customerId: profile.id, archivedAt: null };

      const [total, wigs] = await Promise.all([
        prisma.wigProfile.count({ where }),
        prisma.wigProfile.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: { _count: { select: { attachments: true } } },
        }),
      ]);

      return reply.send(
        successResponse(
          wigs.map((w) => mapWig(w)),
          request.requestId,
          paginationMeta(total, page, limit),
        ),
      );
    },
  );

  app.post(
    `${API_PREFIX}/wigs`,
    {
      preHandler: [app.authenticate],
      schema: { body: createWigSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);

      const wig = await prisma.wigProfile.create({
        data: {
          customerId: profile.id,
          reference: generateWigReference(),
          ...request.body,
        },
      });

      return reply.status(201).send(successResponse(mapWig(wig), request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/wigs/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);
      const { id } = request.params as { id: string };

      const wig = await prisma.wigProfile.findFirst({
        where: { id, customerId: profile.id, archivedAt: null },
        include: { _count: { select: { attachments: true } } },
      });

      if (!wig) {
        throw app.httpErrors.notFound('Wig not found');
      }

      return reply.send(successResponse(mapWig(wig), request.requestId));
    },
  );

  app.patch(
    `${API_PREFIX}/wigs/:id`,
    {
      preHandler: [app.authenticate],
      schema: { body: updateWigSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);
      const { id } = request.params as { id: string };

      const existing = await prisma.wigProfile.findFirst({
        where: { id, customerId: profile.id, archivedAt: null },
      });
      if (!existing) {
        throw app.httpErrors.notFound('Wig not found');
      }

      const wig = await prisma.wigProfile.update({
        where: { id },
        data: request.body,
        include: { _count: { select: { attachments: true } } },
      });

      return reply.send(successResponse(mapWig(wig), request.requestId));
    },
  );

  app.delete(
    `${API_PREFIX}/wigs/:id`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const profile = await requireCustomerProfile(user.sub);
      const { id } = request.params as { id: string };

      const existing = await prisma.wigProfile.findFirst({
        where: { id, customerId: profile.id, archivedAt: null },
      });
      if (!existing) {
        throw app.httpErrors.notFound('Wig not found');
      }

      await prisma.wigProfile.update({
        where: { id },
        data: { archivedAt: new Date() },
      });

      return reply.send(successResponse({ archived: true }, request.requestId));
    },
  );
}
