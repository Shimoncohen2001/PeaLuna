import type { CreateReviewInput, PublicReviewDto } from '@velure/contracts';
import { prisma } from '@velure/database';
import { requireCustomerProfile } from '../../lib/access.js';

const publicReviewInclude = {
  order: {
    select: {
      technicianId: true,
      customer: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  },
} as const;

function publicCustomerName(firstName: string, lastName: string) {
  const first = firstName.trim();
  const initial = lastName.trim().charAt(0);
  if (first && initial) return `${first} ${initial.toUpperCase()}.`;
  return first;
}

function toPublicReview(row: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  order: {
    customer: { user: { firstName: string; lastName: string } };
  };
}): PublicReviewDto {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment?.trim() ? row.comment.trim() : null,
    createdAt: row.createdAt.toISOString(),
    customerName: publicCustomerName(row.order.customer.user.firstName, row.order.customer.user.lastName),
  };
}

export class ReviewService {
  async createForOrder(orderId: string, userId: string, input: CreateReviewInput) {
    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: { review: true, technician: true },
    });

    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (order.paymentStatus !== 'CAPTURED' && order.status !== 'COMPLETED') {
      throw Object.assign(new Error('Service must be completed before reviewing'), {
        statusCode: 403,
        code: 'REVIEW_NOT_ALLOWED',
      });
    }
    if (!order.technicianId) {
      throw Object.assign(new Error('No technician on this order'), {
        statusCode: 400,
        code: 'NO_TECHNICIAN',
      });
    }
    if (order.review) {
      throw Object.assign(new Error('Review already submitted'), {
        statusCode: 409,
        code: 'REVIEW_EXISTS',
      });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: order.id,
          rating: input.rating,
          comment: input.comment?.trim() ? input.comment.trim() : null,
        },
      });

      const agg = await tx.review.aggregate({
        where: { order: { technicianId: order.technicianId } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.technicianProfile.update({
        where: { id: order.technicianId! },
        data: {
          ratingAvg: Math.round((agg._avg.rating ?? input.rating) * 10) / 10,
          reviewCount: agg._count.rating,
        },
      });

      return created;
    });

    return {
      id: review.id,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async getForOrder(orderId: string, userId: string) {
    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: { review: true },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (!order.review) {
      return null;
    }
    return {
      id: order.review.id,
      orderId: order.review.orderId,
      rating: order.review.rating,
      comment: order.review.comment,
      createdAt: order.review.createdAt.toISOString(),
    };
  }

  async listForTechnician(userId: string, page: number, limit: number) {
    const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw Object.assign(new Error('Technician profile not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }
    if (profile.status !== 'APPROVED') {
      throw Object.assign(new Error('Technician application is not approved'), {
        statusCode: 403,
        code: 'TECHNICIAN_NOT_APPROVED',
      });
    }

    const where = { order: { technicianId: profile.id } };
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      reviews: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        orderNumber: r.order.orderNumber,
        customerName: `${r.order.customer.user.firstName} ${r.order.customer.user.lastName}`.trim(),
      })),
    };
  }

  async listPublicForTechnician(technicianId: string, page: number, limit: number) {
    const profile = await prisma.technicianProfile.findFirst({
      where: { id: technicianId, status: 'APPROVED' },
      select: { id: true, ratingAvg: true, reviewCount: true },
    });
    if (!profile) {
      throw Object.assign(new Error('Technician not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }

    const where = { order: { technicianId: profile.id } };
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: publicReviewInclude,
      }),
    ]);

    return {
      ratingAvg: profile.ratingAvg,
      reviewCount: profile.reviewCount,
      total,
      reviews: reviews.map(toPublicReview),
    };
  }

  async previewsForTechnicianIds(ids: string[]): Promise<Map<string, PublicReviewDto>> {
    const map = new Map<string, PublicReviewDto>();
    if (ids.length === 0) return map;

    const rows = await prisma.review.findMany({
      where: {
        comment: { not: null },
        order: { technicianId: { in: ids } },
      },
      orderBy: { createdAt: 'desc' },
      take: ids.length * 8,
      include: publicReviewInclude,
    });

    for (const row of rows) {
      const technicianId = row.order.technicianId;
      if (!technicianId || map.has(technicianId) || !row.comment?.trim()) continue;
      map.set(technicianId, toPublicReview(row));
    }
    return map;
  }
}
