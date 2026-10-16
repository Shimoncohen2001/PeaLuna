import type { S3Client } from '@aws-sdk/client-s3';
import { Prisma, prisma, type OrderStatus, type UserStatus } from '@velure/database';
import type { AdminCustomersQuery, AdminExpertsQuery } from '@velure/contracts';
import type { Env } from '../../config/env.js';
import { mediaPublicUrl } from '../media/media-url.js';
import { createS3Client } from '../media/s3.js';
import {
  BOOKING_STATUSES,
  CONFIRMED_STATUSES,
  PENDING_STATUSES,
  averageBasketCents,
  bookingBucket,
  cancellationRateBps,
  fillSeries,
  grainForPeriod,
  periodStart,
  seriesKeys,
  type DashboardPeriod,
} from './admin.metrics.js';
import {
  accumulateCustomerOrder,
  compareCustomerRows,
  customerSearchTokens,
  emptyCustomerStats,
  finalizeCustomerStats,
  statsByCustomer,
} from './admin.customers.js';
import {
  compareExpertRows,
  emptyExpertStats,
  finalizeExpertStats,
  statsByExpert,
  type ExpertSortBy,
} from './admin.experts.js';

const NOT_DELETED = { not: 'DELETED' as const };

type BucketRow = { bucket: string; value: bigint | number };

const expertOrderSelect = {
  technicianId: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  totalCents: true,
  platformFeeCents: true,
  createdAt: true,
  completedAt: true,
  cashConfirmedAt: true,
} as const;

export class AdminService {
  constructor(private readonly env: Env) {}

  async dashboard(period: DashboardPeriod) {
    const now = new Date();
    const requestedSince = periodStart(period, now);
    const sevenDaysAgo = daysAgo(now, 7);
    const thirtyDaysAgo = daysAgo(now, 30);
    const grain = grainForPeriod(period);

    const [
      customersTotal,
      customersNew7,
      customersNew30,
      earliestOrder,
      bookingGroups,
      paidAgg,
      expertGroups,
      recent,
    ] = await Promise.all([
      prisma.customerProfile.count({
        where: { user: { status: NOT_DELETED } },
      }),
      prisma.customerProfile.count({
        where: { createdAt: { gte: sevenDaysAgo }, user: { status: NOT_DELETED } },
      }),
      prisma.customerProfile.count({
        where: { createdAt: { gte: thirtyDaysAgo }, user: { status: NOT_DELETED } },
      }),
      prisma.repairOrder.findFirst({
        where: { status: { in: BOOKING_STATUSES } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.repairOrder.groupBy({
        by: ['status'],
        where: {
          status: { in: BOOKING_STATUSES },
          ...(period === 'all' ? {} : { createdAt: { gte: requestedSince } }),
        },
        _count: { _all: true },
      }),
      this.capturedRevenue(period === 'all' ? new Date(0) : requestedSince),
      prisma.technicianProfile.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.repairOrder.findMany({
        where: { status: { in: BOOKING_STATUSES } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          scheduledAt: true,
          paymentStatus: true,
          customer: { select: { user: { select: { firstName: true, lastName: true } } } },
          technician: { select: { displayName: true } },
        },
      }),
    ]);

    const since =
      period === 'all' && earliestOrder?.createdAt
        ? new Date(
            Date.UTC(
              earliestOrder.createdAt.getUTCFullYear(),
              earliestOrder.createdAt.getUTCMonth(),
              1,
            ),
          )
        : requestedSince;

    const keys = seriesKeys(period, since, now);
    const [bookingRows, revenueRows] = await Promise.all([
      this.seriesByCreatedAt(grain, since),
      this.seriesByCapturedAt(grain, since),
    ]);

    const bookings = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const row of bookingGroups) {
      const count = row._count._all;
      if ((PENDING_STATUSES as OrderStatus[]).includes(row.status)) bookings.pending += count;
      else if ((CONFIRMED_STATUSES as OrderStatus[]).includes(row.status)) bookings.confirmed += count;
      else if (row.status === 'COMPLETED') bookings.completed += count;
      else if (row.status === 'CANCELLED') bookings.cancelled += count;
    }
    const bookingsTotal =
      bookings.pending + bookings.confirmed + bookings.completed + bookings.cancelled;

    const gmvCents = paidAgg.gmvCents;
    const commissionCents = paidAgg.commissionCents;
    const paidCount = paidAgg.paidCount;

    const expertsApproved = expertGroups.find((row) => row.status === 'APPROVED')?._count._all ?? 0;
    const expertsReview = expertGroups
      .filter((row) => row.status === 'UNDER_REVIEW' || row.status === 'PENDING_APPLICATION')
      .reduce((sum, row) => sum + row._count._all, 0);

    return {
      period,
      currency: 'ILS',
      customers: {
        total: customersTotal,
        new7: customersNew7,
        new30: customersNew30,
      },
      bookings,
      bookingsTotal,
      revenue: {
        gmvCents,
        commissionCents,
        paidCount,
        averageBasketCents: averageBasketCents(gmvCents, paidCount),
      },
      cancellationRateBps: cancellationRateBps(bookings.cancelled, bookingsTotal),
      experts: {
        approved: expertsApproved,
        review: expertsReview,
      },
      series: {
        grain,
        bookings: fillSeries(keys, bookingRows),
        gmvCents: fillSeries(keys, revenueRows),
      },
      recent: recent.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        scheduledAt: order.scheduledAt?.toISOString() ?? null,
        paymentStatus: order.paymentStatus,
        customerName: `${order.customer.user.firstName} ${order.customer.user.lastName}`.trim(),
        technicianName: order.technician?.displayName ?? null,
      })),
    };
  }

  async listCustomers(query: AdminCustomersQuery) {
    const tokens = customerSearchTokens(query.q);
    const userStatus: UserStatus | undefined =
      query.status === 'all' ? undefined : query.status;

    const where: Prisma.CustomerProfileWhereInput = {
      user: { status: userStatus ?? NOT_DELETED },
      ...(tokens.length ? customerNameSearchWhere(tokens) : {}),
    };

    const rows = await prisma.customerProfile.findMany({
      where,
      select: {
        id: true,
        phone: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            createdAt: true,
            roles: { select: { role: { select: { name: true } } } },
          },
        },
      },
    });

    const ids = rows.map((row) => row.id);
    const orderRows =
      ids.length === 0
        ? []
        : await prisma.repairOrder.findMany({
            where: { customerId: { in: ids }, status: { in: BOOKING_STATUSES } },
            select: {
              customerId: true,
              status: true,
              paymentStatus: true,
              totalCents: true,
              createdAt: true,
            },
          });
    const stats = statsByCustomer(orderRows);

    const mapped = rows.map((row) => {
      const summary = stats.get(row.id) ?? emptyCustomerStats();
      return {
        id: row.id,
        name: `${row.user.firstName} ${row.user.lastName}`.trim(),
        email: row.user.email,
        phone: row.phone,
        status: row.user.status,
        createdAt: row.user.createdAt.toISOString(),
        roles: publicRoles(row.user.roles.map((item) => item.role.name)),
        bookings: summary.bookings,
        cancelled: summary.cancelled,
        spentCents: summary.spentCents,
        paidCount: summary.paidCount,
        averageBasketCents: summary.averageBasketCents,
        currency: 'ILS',
        lastBookingAt: summary.lastBookingAt,
      };
    });

    const filtered =
      query.activity === 'booked'
        ? mapped.filter((row) => row.bookings > 0)
        : query.activity === 'none'
          ? mapped.filter((row) => row.bookings === 0)
          : mapped;

    filtered.sort((left, right) =>
      compareCustomerRows(left, right, query.sortBy, query.sortOrder),
    );

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    return {
      items: filtered.slice(start, start + query.limit),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async getCustomer(id: string) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            countryCode: true,
            locale: true,
            createdAt: true,
            emailVerifiedAt: true,
            passwordHash: true,
            roles: { select: { role: { select: { name: true } } } },
            authIdentities: { select: { provider: true } },
          },
        },
        wigs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            reference: true,
            brand: true,
            color: true,
            fiberType: true,
            lengthCm: true,
            currentCondition: true,
            lastCareAt: true,
            lastTechnicianName: true,
            archivedAt: true,
            _count: { select: { orders: true } },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            totalCents: true,
            currency: true,
            createdAt: true,
            scheduledAt: true,
            completedAt: true,
            venueType: true,
            serviceCity: true,
            technician: { select: { id: true, displayName: true } },
            wig: { select: { name: true } },
            lineItems: { select: { serviceType: { select: { slug: true, name: true } } } },
            attachments: {
              where: {
                OR: [
                  { photoPhase: { in: ['BEFORE', 'AFTER'] } },
                  { purpose: { in: ['BEFORE_CARE', 'AFTER_CARE'] } },
                ],
              },
              select: {
                id: true,
                mimeType: true,
                photoPhase: true,
                photoAngle: true,
                purpose: true,
                storageKey: true,
              },
            },
            careReport: {
              select: {
                status: true,
                submittedAt: true,
                beforeGeneralCondition: true,
                afterGeneralCondition: true,
                nextCareAt: true,
                operations: { select: { code: true } },
                photos: {
                  where: {
                    OR: [
                      { photoPhase: { in: ['BEFORE', 'AFTER'] } },
                      { purpose: { in: ['BEFORE_CARE', 'AFTER_CARE'] } },
                    ],
                  },
                  select: {
                    id: true,
                    mimeType: true,
                    photoPhase: true,
                    photoAngle: true,
                    purpose: true,
                    storageKey: true,
                  },
                },
              },
            },
            transactions: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                type: true,
                status: true,
                amountCents: true,
                currency: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!profile || profile.user.status === 'DELETED') {
      throw Object.assign(new Error('Customer not found'), {
        statusCode: 404,
        code: 'CUSTOMER_NOT_FOUND',
      });
    }

    const summary = finalizeCustomerStats(
      profile.orders.reduce((acc, order) => {
        accumulateCustomerOrder(acc, {
          customerId: profile.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalCents: order.totalCents,
          createdAt: order.createdAt,
        });
        return acc;
      }, emptyCustomerStats()),
    );

    const experts = new Map<
      string,
      { id: string; name: string; bookings: number; spentCents: number }
    >();
    for (const order of profile.orders) {
      if (!order.technician || !bookingBucket(order.status)) continue;
      const current = experts.get(order.technician.id) ?? {
        id: order.technician.id,
        name: order.technician.displayName ?? '—',
        bookings: 0,
        spentCents: 0,
      };
      current.bookings += 1;
      if (order.paymentStatus === 'CAPTURED') current.spentCents += order.totalCents;
      experts.set(order.technician.id, current);
    }

    const currency =
      profile.orders.find((order) => order.paymentStatus === 'CAPTURED')?.currency ??
      profile.orders[0]?.currency ??
      'ILS';

    const s3 = createS3Client(this.env);
    const bookings = await Promise.all(
      profile.orders.map(async (order) => {
        const photos = await signedCarePhotos(this.env, s3, [
          ...(order.careReport?.photos ?? []),
          ...order.attachments,
        ]);
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          totalCents: order.totalCents,
          currency: order.currency,
          createdAt: order.createdAt.toISOString(),
          scheduledAt: order.scheduledAt?.toISOString() ?? null,
          completedAt: order.completedAt?.toISOString() ?? null,
          venueType: order.venueType,
          serviceCity: order.serviceCity,
          expertName: order.technician?.displayName ?? null,
          wigName: order.wig.name,
          services: order.lineItems.map((item) => ({
            slug: item.serviceType.slug,
            name: item.serviceType.name,
          })),
          photos,
          care: order.careReport
            ? {
                status: order.careReport.status,
                submittedAt: order.careReport.submittedAt?.toISOString() ?? null,
                operations: order.careReport.operations.map((operation) => operation.code),
                beforeCondition: order.careReport.beforeGeneralCondition,
                afterCondition: order.careReport.afterGeneralCondition,
                nextCareAt: order.careReport.nextCareAt?.toISOString() ?? null,
              }
            : null,
        };
      }),
    );

    return {
      id: profile.id,
      name: `${profile.user.firstName} ${profile.user.lastName}`.trim(),
      email: profile.user.email,
      phone: profile.phone,
      status: profile.user.status,
      countryCode: profile.user.countryCode,
      locale: profile.user.locale,
      createdAt: profile.user.createdAt.toISOString(),
      emailVerifiedAt: profile.user.emailVerifiedAt?.toISOString() ?? null,
      roles: publicRoles(profile.user.roles.map((item) => item.role.name)),
      providers: [
        ...new Set([
          ...(profile.user.passwordHash ? ['password'] : []),
          ...profile.user.authIdentities.map((identity) => identity.provider),
        ]),
      ],
      summary: { ...summary, currency },
      experts: [...experts.values()].sort((left, right) => right.bookings - left.bookings),
      bookings,
      transactions: profile.orders
        .flatMap((order) =>
          order.transactions.map((transaction) => ({
            id: transaction.id,
            orderNumber: order.orderNumber,
            type: transaction.type,
            status: transaction.status,
            amountCents: transaction.amountCents,
            currency: transaction.currency,
            createdAt: transaction.createdAt.toISOString(),
          })),
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 50),
      wigs: profile.wigs.map((wig) => ({
        id: wig.id,
        name: wig.name,
        reference: wig.reference,
        brand: wig.brand,
        color: wig.color,
        fiberType: wig.fiberType,
        lengthCm: wig.lengthCm,
        currentCondition: wig.currentCondition,
        lastCareAt: wig.lastCareAt?.toISOString() ?? null,
        lastTechnicianName: wig.lastTechnicianName,
        archivedAt: wig.archivedAt?.toISOString() ?? null,
        bookings: wig._count.orders,
      })),
    };
  }

  async expertsOverview(period: DashboardPeriod) {
    const now = new Date();
    const since = period === 'all' ? null : periodStart(period, now);
    const sevenDaysAgo = daysAgo(now, 7);
    const thirtyDaysAgo = daysAgo(now, 30);
    const grain = grainForPeriod(period);
    const seriesSince = periodStart(period, now);

    const [statusGroups, new7, new30, newPeriod, orders, transfers, commissions, reviews] =
      await Promise.all([
        prisma.technicianProfile.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.technicianProfile.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.technicianProfile.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        since
          ? prisma.technicianProfile.count({ where: { createdAt: { gte: since } } })
          : prisma.technicianProfile.count(),
        prisma.repairOrder.findMany({
          where: { technicianId: { not: null }, status: { in: BOOKING_STATUSES } },
          select: expertOrderSelect,
        }),
        prisma.transaction.findMany({
          where: { type: 'TRANSFER', status: 'SUCCEEDED', order: { technicianId: { not: null } } },
          select: {
            amountCents: true,
            createdAt: true,
            order: { select: { technicianId: true } },
          },
        }),
        prisma.platformCommission.findMany({
          where: { dueFromTechnician: true, order: { technicianId: { not: null } } },
          select: {
            commissionCents: true,
            dueFromTechnician: true,
            settledAt: true,
            order: { select: { technicianId: true } },
          },
        }),
        prisma.review.aggregate({
          where: {
            order: { technicianId: { not: null } },
            ...(since ? { createdAt: { gte: since } } : {}),
          },
          _avg: { rating: true },
          _count: { _all: true },
        }),
      ]);

    const byStatus = Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all]));
    const total = statusGroups.reduce((sum, row) => sum + row._count._all, 0);
    const active = byStatus.APPROVED ?? 0;
    const review = (byStatus.UNDER_REVIEW ?? 0) + (byStatus.PENDING_APPLICATION ?? 0);

    const perExpert = statsByExpert({
      orders: orders.flatMap((order) =>
        order.technicianId ? [{ ...order, technicianId: order.technicianId }] : [],
      ),
      transfers: transfers.flatMap((row) =>
        row.order.technicianId
          ? [
              {
                technicianId: row.order.technicianId,
                amountCents: row.amountCents,
                createdAt: row.createdAt,
              },
            ]
          : [],
      ),
      commissions: commissions.flatMap((row) =>
        row.order.technicianId
          ? [
              {
                technicianId: row.order.technicianId,
                commissionCents: row.commissionCents,
                dueFromTechnician: row.dueFromTechnician,
                settledAt: row.settledAt,
              },
            ]
          : [],
      ),
      bookingSince: since,
      paymentSince: since,
    });

    const totals = finalizeExpertStats(
      [...perExpert.values()].reduce((acc, row) => {
        acc.bookings += row.bookings;
        acc.pending += row.pending;
        acc.confirmed += row.confirmed;
        acc.completed += row.completed;
        acc.cancelled += row.cancelled;
        acc.paidCount += row.paidCount;
        acc.gmvCents += row.gmvCents;
        acc.commissionCents += row.commissionCents;
        acc.expertShareCents += row.expertShareCents;
        acc.transferredCents += row.transferredCents;
        acc.cashKeptCents += row.cashKeptCents;
        acc.cashCommissionDueCents += row.cashCommissionDueCents;
        acc.cashCommissionSettledCents += row.cashCommissionSettledCents;
        return acc;
      }, emptyExpertStats()),
    );

    const keys = seriesKeys(period, seriesSince, now);
    const [bookingRows, gmvRows, commissionRows] = await Promise.all([
      this.seriesExpertsByCreatedAt(grain, seriesSince),
      this.seriesExpertsCaptured(grain, seriesSince, 'total_cents'),
      this.seriesExpertsCaptured(grain, seriesSince, 'platform_fee_cents'),
    ]);

    return {
      period,
      currency: 'ILS',
      experts: {
        total,
        active,
        review,
        new7,
        new30,
        newPeriod,
      },
      bookings: {
        total: totals.bookings,
        pending: totals.pending,
        confirmed: totals.confirmed,
        completed: totals.completed,
        cancelled: totals.cancelled,
      },
      finance: {
        paidCount: totals.paidCount,
        gmvCents: totals.gmvCents,
        commissionCents: totals.commissionCents,
        expertShareCents: totals.expertShareCents,
        transferredCents: totals.transferredCents,
        cashKeptCents: totals.cashKeptCents,
        cashCommissionDueCents: totals.cashCommissionDueCents,
        cashCommissionSettledCents: totals.cashCommissionSettledCents,
        averageBasketCents: totals.averageBasketCents,
      },
      cancellationRateBps: totals.cancellationRateBps,
      completionRateBps: totals.completionRateBps,
      reviews: {
        count: reviews._count._all,
        average: reviews._avg.rating ? Math.round(reviews._avg.rating * 10) / 10 : 0,
      },
      series: {
        grain,
        bookings: fillSeries(keys, bookingRows),
        gmvCents: fillSeries(keys, gmvRows),
        commissionCents: fillSeries(keys, commissionRows),
      },
    };
  }

  async listExperts(query: AdminExpertsQuery) {
    const tokens = customerSearchTokens(query.q);
    const since = query.period === 'all' ? null : periodStart(query.period);
    const where: Prisma.TechnicianProfileWhereInput = {
      ...(query.status === 'all' ? {} : { status: query.status }),
      ...(tokens.length ? expertSearchWhere(tokens) : {}),
    };

    const rows = await prisma.technicianProfile.findMany({
      where,
      select: {
        id: true,
        status: true,
        displayName: true,
        headline: true,
        serviceCity: true,
        ratingAvg: true,
        reviewCount: true,
        createdAt: true,
        approvedAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const ids = rows.map((row) => row.id);
    const [orders, transfers, commissions] =
      ids.length === 0
        ? [[], [], []]
        : await Promise.all([
            prisma.repairOrder.findMany({
              where: { technicianId: { in: ids }, status: { in: BOOKING_STATUSES } },
              select: expertOrderSelect,
            }),
            prisma.transaction.findMany({
              where: {
                type: 'TRANSFER',
                status: 'SUCCEEDED',
                order: { technicianId: { in: ids } },
              },
              select: {
                amountCents: true,
                createdAt: true,
                order: { select: { technicianId: true } },
              },
            }),
            prisma.platformCommission.findMany({
              where: { dueFromTechnician: true, order: { technicianId: { in: ids } } },
              select: {
                commissionCents: true,
                dueFromTechnician: true,
                settledAt: true,
                order: { select: { technicianId: true } },
              },
            }),
          ]);

    const stats = statsByExpert({
      orders: orders.flatMap((order) =>
        order.technicianId ? [{ ...order, technicianId: order.technicianId }] : [],
      ),
      transfers: transfers.flatMap((row) =>
        row.order.technicianId
          ? [{ technicianId: row.order.technicianId, amountCents: row.amountCents, createdAt: row.createdAt }]
          : [],
      ),
      commissions: commissions.flatMap((row) =>
        row.order.technicianId
          ? [
              {
                technicianId: row.order.technicianId,
                commissionCents: row.commissionCents,
                dueFromTechnician: row.dueFromTechnician,
                settledAt: row.settledAt,
              },
            ]
          : [],
      ),
      bookingSince: since,
      paymentSince: since,
    });

    const mapped = rows.map((row) => {
      const summary = stats.get(row.id) ?? emptyExpertStats();
      return {
        id: row.id,
        name: row.displayName ?? `${row.user.firstName} ${row.user.lastName}`.trim(),
        email: row.user.email,
        headline: row.headline,
        city: row.serviceCity,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        approvedAt: row.approvedAt?.toISOString() ?? null,
        ratingAvg: row.ratingAvg,
        reviewCount: row.reviewCount,
        ...summary,
        currency: 'ILS' as const,
      };
    });

    const filtered =
      query.activity === 'booked'
        ? mapped.filter((row) => row.bookings > 0)
        : query.activity === 'none'
          ? mapped.filter((row) => row.bookings === 0)
          : mapped;

    filtered.sort((left, right) =>
      compareExpertRows(left, right, query.sortBy as ExpertSortBy, query.sortOrder),
    );

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    return {
      items: filtered.slice(start, start + query.limit),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async getExpert(id: string, period: DashboardPeriod) {
    const profile = await prisma.technicianProfile.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        displayName: true,
        headline: true,
        bio: true,
        yearsExperience: true,
        serviceCity: true,
        servicePostalCode: true,
        serviceCountryCode: true,
        salonAddress: true,
        offersHomeService: true,
        offersSalonService: true,
        acceptsCashPayment: true,
        stripeOnboardingComplete: true,
        ratingAvg: true,
        reviewCount: true,
        approvedAt: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true, status: true } },
        services: {
          select: {
            customPriceCents: true,
            serviceType: {
              select: { slug: true, name: true, basePriceCents: true, currency: true },
            },
          },
        },
        skills: {
          where: { skill: { isActive: true } },
          select: { skill: { select: { slug: true, name: true } } },
        },
      },
    });

    if (!profile) {
      throw Object.assign(new Error('Expert not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }

    const since = period === 'all' ? null : periodStart(period);
    const [orders, transfers, commissions, reviews] = await Promise.all([
      prisma.repairOrder.findMany({
        where: { technicianId: id },
        orderBy: { createdAt: 'desc' },
        take: 80,
        select: {
          ...expertOrderSelect,
          id: true,
          orderNumber: true,
          currency: true,
          scheduledAt: true,
          venueType: true,
          customer: { select: { user: { select: { firstName: true, lastName: true } } } },
          wig: { select: { name: true } },
          lineItems: { select: { serviceType: { select: { slug: true, name: true } } } },
        },
      }),
      prisma.transaction.findMany({
        where: { type: 'TRANSFER', status: 'SUCCEEDED', order: { technicianId: id } },
        select: { amountCents: true, createdAt: true, order: { select: { technicianId: true } } },
      }),
      prisma.platformCommission.findMany({
        where: { dueFromTechnician: true, order: { technicianId: id } },
        select: {
          commissionCents: true,
          dueFromTechnician: true,
          settledAt: true,
          order: { select: { technicianId: true } },
        },
      }),
      prisma.review.findMany({
        where: { order: { technicianId: id } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              customer: { select: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      }),
    ]);

    const bookingOrders = orders.filter((order) =>
      (BOOKING_STATUSES as string[]).includes(order.status),
    );
    const summary =
      statsByExpert({
        orders: bookingOrders.map((order) => ({ ...order, technicianId: id })),
        transfers: transfers.flatMap((row) =>
          row.order.technicianId
            ? [{ technicianId: id, amountCents: row.amountCents, createdAt: row.createdAt }]
            : [],
        ),
        commissions: commissions.map((row) => ({
          technicianId: id,
          commissionCents: row.commissionCents,
          dueFromTechnician: row.dueFromTechnician,
          settledAt: row.settledAt,
        })),
        bookingSince: since,
        paymentSince: since,
      }).get(id) ?? finalizeExpertStats(emptyExpertStats());

    return {
      id: profile.id,
      name: profile.displayName ?? `${profile.user.firstName} ${profile.user.lastName}`.trim(),
      email: profile.user.email,
      headline: profile.headline,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      city: profile.serviceCity,
      postalCode: profile.servicePostalCode,
      countryCode: profile.serviceCountryCode,
      salonAddress: profile.salonAddress,
      offersHomeService: profile.offersHomeService,
      offersSalonService: profile.offersSalonService,
      acceptsCashPayment: profile.acceptsCashPayment,
      stripeReady: profile.stripeOnboardingComplete,
      status: profile.status,
      accountStatus: profile.user.status,
      createdAt: profile.createdAt.toISOString(),
      approvedAt: profile.approvedAt?.toISOString() ?? null,
      ratingAvg: profile.ratingAvg,
      reviewCount: profile.reviewCount,
      currency: 'ILS',
      period,
      summary,
      services: profile.services.map((item) => ({
        slug: item.serviceType.slug,
        name: item.serviceType.name,
        basePriceCents: item.serviceType.basePriceCents,
        priceCents: item.customPriceCents ?? item.serviceType.basePriceCents,
        custom: item.customPriceCents != null,
        currency: item.serviceType.currency,
      })),
      skills: profile.skills.map((item) => item.skill.name),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        orderNumber: review.order.orderNumber,
        customerName:
          `${review.order.customer.user.firstName} ${review.order.customer.user.lastName}`.trim(),
      })),
      bookings: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalCents: order.totalCents,
        platformFeeCents: order.platformFeeCents,
        expertShareCents: order.totalCents - order.platformFeeCents,
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        scheduledAt: order.scheduledAt?.toISOString() ?? null,
        completedAt: order.completedAt?.toISOString() ?? null,
        venueType: order.venueType,
        customerName: `${order.customer.user.firstName} ${order.customer.user.lastName}`.trim(),
        wigName: order.wig.name,
        services: order.lineItems.map((item) => ({
          slug: item.serviceType.slug,
          name: item.serviceType.name,
        })),
      })),
    };
  }

  private async capturedRevenue(since: Date): Promise<{
    gmvCents: number;
    commissionCents: number;
    paidCount: number;
  }> {
    const rows = await prisma.$queryRaw<
      Array<{ gmv: bigint; commission: bigint; paid: bigint }>
    >(Prisma.sql`
      SELECT coalesce(sum(total_cents), 0)::bigint AS gmv,
             coalesce(sum(platform_fee_cents), 0)::bigint AS commission,
             count(*)::bigint AS paid
      FROM repair_orders
      WHERE payment_status = 'CAPTURED'
        AND COALESCE(completed_at, cash_confirmed_at, created_at) >= ${since}
    `);
    const row = rows[0];
    return {
      gmvCents: Number(row?.gmv ?? 0),
      commissionCents: Number(row?.commission ?? 0),
      paidCount: Number(row?.paid ?? 0),
    };
  }

  private async seriesByCreatedAt(
    grain: ReturnType<typeof grainForPeriod>,
    since: Date,
  ): Promise<Array<{ bucket: string; value: number }>> {
    const fmt = bucketFormatSql(grain);
    const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(created_at AT TIME ZONE 'UTC', ${fmt}) AS bucket,
             count(*)::bigint AS value
      FROM repair_orders
      WHERE status::text IN (${statusListSql()})
        AND created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ bucket: row.bucket, value: Number(row.value) }));
  }

  private async seriesByCapturedAt(
    grain: ReturnType<typeof grainForPeriod>,
    since: Date,
  ): Promise<Array<{ bucket: string; value: number }>> {
    const fmt = bucketFormatSql(grain);
    const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(
               COALESCE(completed_at, cash_confirmed_at, created_at) AT TIME ZONE 'UTC',
               ${fmt}
             ) AS bucket,
             coalesce(sum(total_cents), 0)::bigint AS value
      FROM repair_orders
      WHERE payment_status = 'CAPTURED'
        AND COALESCE(completed_at, cash_confirmed_at, created_at) >= ${since}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ bucket: row.bucket, value: Number(row.value) }));
  }

  private async seriesExpertsByCreatedAt(
    grain: ReturnType<typeof grainForPeriod>,
    since: Date,
  ): Promise<Array<{ bucket: string; value: number }>> {
    const fmt = bucketFormatSql(grain);
    const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(created_at AT TIME ZONE 'UTC', ${fmt}) AS bucket,
             count(*)::bigint AS value
      FROM repair_orders
      WHERE technician_id IS NOT NULL
        AND status::text IN (${statusListSql()})
        AND created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ bucket: row.bucket, value: Number(row.value) }));
  }

  private async seriesExpertsCaptured(
    grain: ReturnType<typeof grainForPeriod>,
    since: Date,
    column: 'total_cents' | 'platform_fee_cents',
  ): Promise<Array<{ bucket: string; value: number }>> {
    const fmt = bucketFormatSql(grain);
    const amount = column === 'platform_fee_cents' ? Prisma.raw('platform_fee_cents') : Prisma.raw('total_cents');
    const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(
               COALESCE(completed_at, cash_confirmed_at, created_at) AT TIME ZONE 'UTC',
               ${fmt}
             ) AS bucket,
             coalesce(sum(${amount}), 0)::bigint AS value
      FROM repair_orders
      WHERE technician_id IS NOT NULL
        AND payment_status = 'CAPTURED'
        AND COALESCE(completed_at, cash_confirmed_at, created_at) >= ${since}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ bucket: row.bucket, value: Number(row.value) }));
  }
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function statusListSql() {
  return Prisma.join(BOOKING_STATUSES.map((status) => Prisma.sql`${status}`));
}

function bucketFormatSql(grain: ReturnType<typeof grainForPeriod>) {
  if (grain === 'day') return Prisma.raw(`'YYYY-MM-DD'`);
  if (grain === 'week') return Prisma.raw(`'IYYY-"W"IW'`);
  return Prisma.raw(`'YYYY-MM'`);
}

const VISIBLE_ROLES = new Set(['CUSTOMER', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'OPS']);

function publicRoles(names: string[]): string[] {
  return names.filter((name) => VISIBLE_ROLES.has(name));
}

function expertSearchWhere(tokens: string[]): Prisma.TechnicianProfileWhereInput {
  return {
    AND: tokens.map((token) => ({
      OR: [
        { displayName: { contains: token, mode: 'insensitive' } },
        { serviceCity: { contains: token, mode: 'insensitive' } },
        { user: { firstName: { contains: token, mode: 'insensitive' } } },
        { user: { lastName: { contains: token, mode: 'insensitive' } } },
        { user: { email: { contains: token, mode: 'insensitive' } } },
      ],
    })),
  };
}

function customerNameSearchWhere(tokens: string[]): Prisma.CustomerProfileWhereInput {
  return {
    AND: tokens.map((token) => {
      const digits = token.replace(/\D/g, '');
      const or: Prisma.CustomerProfileWhereInput[] = [
        { user: { firstName: { contains: token, mode: 'insensitive' } } },
        { user: { lastName: { contains: token, mode: 'insensitive' } } },
        { user: { email: { contains: token, mode: 'insensitive' } } },
        { phone: { contains: token, mode: 'insensitive' } },
      ];
      if (digits.length >= 4) {
        or.push({ phone: { contains: digits } });
      }
      return { OR: or };
    }),
  };
}

type CarePhotoRow = {
  id: string;
  mimeType: string;
  photoPhase: 'BEFORE' | 'AFTER' | null;
  photoAngle: string | null;
  purpose: string;
  storageKey: string;
};

function carePhotoPhase(row: CarePhotoRow): 'BEFORE' | 'AFTER' | null {
  if (row.photoPhase === 'BEFORE' || row.photoPhase === 'AFTER') return row.photoPhase;
  if (row.purpose === 'BEFORE_CARE') return 'BEFORE';
  if (row.purpose === 'AFTER_CARE') return 'AFTER';
  return null;
}

async function signedCarePhotos(env: Env, s3: S3Client | null, rows: CarePhotoRow[]) {
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const photos = await Promise.all(
    unique.map(async (row) => {
      const phase = carePhotoPhase(row);
      if (!phase) return null;
      return {
        id: row.id,
        phase,
        angle: row.photoAngle,
        kind: row.mimeType.startsWith('video/') ? ('video' as const) : ('image' as const),
        url: await mediaPublicUrl(env, s3, row.storageKey),
      };
    }),
  );
  return photos.filter((photo): photo is NonNullable<typeof photo> => Boolean(photo?.url));
}
