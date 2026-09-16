import {
  calculatePlatformCommissionCents,
  getAvailableActions,
  resolveTransition,
  type OrderAction,
  type OrderStatus,
  type Role,
} from '@velure/domain';
import { DEFAULT_CURRENCY, PLATFORM_COMMISSION_BPS } from '@velure/contracts';
import { prisma, type Prisma } from '@velure/database';
import {
  generateOrderNumber,
  requireCustomerProfile,
  requireVerifiedUser,
  toOrderActorRole,
} from '../../lib/access.js';
import { updateOrderIfVersion } from '../../lib/order-lock.js';
import { PaymentService } from '../payments/payment.service.js';

type OrderWithRelations = Prisma.RepairOrderGetPayload<{
  include: {
    lineItems: true;
    wig: { select: { id: true; name: true } };
    review: { select: { id: true } };
    technician: { select: { acceptsCashPayment: true } };
    statusHistory: { select: { action: true }; orderBy: { createdAt: 'desc' }; take: 1 };
  };
}>;

const orderDetailInclude = {
  lineItems: true,
  wig: { select: { id: true, name: true } },
  review: { select: { id: true } },
  technician: { select: { acceptsCashPayment: true } },
  statusHistory: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { action: true },
  },
} satisfies Prisma.RepairOrderInclude;

function mapOrder(order: OrderWithRelations, actorRoles: Role[]) {
  const actorRole = toOrderActorRole(actorRoles, 'customer');
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    version: order.version,
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    platformFeeCents: order.platformFeeCents,
    totalCents: order.totalCents,
    customerNotes: order.customerNotes,
    wigId: order.wigId,
    wigName: order.wig.name,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    cashAccepted: order.technician?.acceptsCashPayment ?? false,
    cashConfirmedAt: order.cashConfirmedAt?.toISOString() ?? null,
    venueType: order.venueType,
    scheduledAt: order.scheduledAt?.toISOString() ?? null,
    availableActions: getAvailableActions(order.status as OrderStatus, actorRole),
    lastAction: order.statusHistory[0]?.action ?? null,
    lineItems: order.lineItems.map((li) => ({
      id: li.id,
      serviceTypeId: li.serviceTypeId,
      serviceName: li.description ?? 'Service',
      quantity: li.quantity,
      unitPriceCents: li.unitPriceCents,
      lineTotalCents: li.totalCents,
    })),
    hasReview: Boolean(order.review),
    submittedAt: order.submittedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export class OrderService {
  constructor(private readonly payments?: PaymentService) {}
  async listForCustomer(userId: string, page: number, limit: number) {
    const profile = await requireCustomerProfile(userId);
    const where = { customerId: profile.id };

    const [total, orders] = await Promise.all([
      prisma.repairOrder.count({ where }),
      prisma.repairOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: orderDetailInclude,
      }),
    ]);

    return { total, orders };
  }

  async getForUser(orderId: string, userId: string, roles: Role[]) {
    const profile = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: profile.id },
      include: orderDetailInclude,
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    return mapOrder(order, roles);
  }

  async create(params: {
    userId: string;
    roles: Role[];
    wigId: string;
    serviceTypeIds: string[];
    customerNotes?: string;
    submit: boolean;
    homeRegion: string;
  }) {
    await requireVerifiedUser(params.userId);
    const profile = await requireCustomerProfile(params.userId);

    const wig = await prisma.wigProfile.findFirst({
      where: { id: params.wigId, customerId: profile.id, archivedAt: null },
    });
    if (!wig) {
      throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
    }

    const services = await prisma.serviceType.findMany({
      where: { id: { in: params.serviceTypeIds }, isActive: true },
    });
    if (services.length !== params.serviceTypeIds.length) {
      throw Object.assign(new Error('One or more services are invalid'), {
        statusCode: 400,
        code: 'INVALID_SERVICES',
      });
    }

    const subtotalCents = services.reduce((sum, s) => sum + s.basePriceCents, 0);
    const platformFeeCents = calculatePlatformCommissionCents(subtotalCents);
    const totalCents = subtotalCents;

    const order = await prisma.$transaction(async (tx) => {
      let created = await tx.repairOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: profile.id,
          wigId: wig.id,
          status: 'DRAFT',
          currency: DEFAULT_CURRENCY,
          subtotalCents,
          platformCommissionBps: PLATFORM_COMMISSION_BPS,
          platformFeeCents,
          totalCents,
          customerNotes: params.customerNotes,
          fulfillmentRegion: params.homeRegion,
          lineItems: {
            create: services.map((s) => ({
              serviceTypeId: s.id,
              description: s.name,
              quantity: 1,
              unitPriceCents: s.basePriceCents,
              totalCents: s.basePriceCents,
            })),
          },
        },
        include: orderDetailInclude,
      });

      if (params.submit) {
        created = await this.applyActionInTx(
          tx,
          created,
          'SUBMIT',
          params.userId,
          params.roles,
          'Submitted by customer',
        );
      }

      return created;
    });

    return mapOrder(order, params.roles);
  }

  async applyAction(params: {
    orderId: string;
    userId: string;
    roles: Role[];
    action: OrderAction;
    note?: string;
    expectedVersion?: number;
  }) {
    const profile = await requireCustomerProfile(params.userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: params.orderId, customerId: profile.id },
      include: orderDetailInclude,
    });

    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }

    if (params.expectedVersion !== undefined && order.version !== params.expectedVersion) {
      throw Object.assign(new Error('Order was modified by another request'), {
        statusCode: 409,
        code: 'VERSION_CONFLICT',
      });
    }

    const updated = await prisma.$transaction(async (tx) =>
      this.applyActionInTx(tx, order, params.action, params.userId, params.roles, params.note),
    );

    if (params.action === 'CANCEL') {
      await this.payments?.voidAuthorization(order.id);
    }

    return mapOrder(updated, params.roles);
  }

  private async applyActionInTx(
    tx: Prisma.TransactionClient,
    order: OrderWithRelations,
    action: OrderAction,
    actorId: string,
    roles: Role[],
    note?: string,
  ) {
    const actorRole = toOrderActorRole(roles, 'customer');
    const transition = resolveTransition(order.status as OrderStatus, action, actorRole);

    const data: Prisma.RepairOrderUpdateManyMutationInput = {
      status: transition.to,
    };

    if (action === 'SUBMIT') {
      data.submittedAt = new Date();
    }
    if (action === 'COMPLETE') {
      data.completedAt = new Date();
    }
    if (action === 'ARCHIVE') {
      data.archivedAt = new Date();
    }

    await updateOrderIfVersion(tx, order.id, order.version, data);

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: transition.to,
        action,
        actorId,
        actorRole,
        reason: note,
      },
    });

    return tx.repairOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: orderDetailInclude,
    });
  }
}
