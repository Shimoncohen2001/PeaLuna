import type { CreateReviewInput } from '@velure/contracts';
import { prisma } from '@velure/database';
import { requireCustomerProfile } from '../../lib/access.js';

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
}
