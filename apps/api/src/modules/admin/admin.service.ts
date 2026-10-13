import { Prisma, prisma, type OrderStatus } from '@velure/database';
import {
  BOOKING_STATUSES,
  CONFIRMED_STATUSES,
  PENDING_STATUSES,
  averageBasketCents,
  cancellationRateBps,
  fillSeries,
  grainForPeriod,
  periodStart,
  seriesKeys,
  type DashboardPeriod,
} from './admin.metrics.js';

const NOT_DELETED = { not: 'DELETED' as const };

type BucketRow = { bucket: string; value: bigint | number };

export class AdminService {
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
