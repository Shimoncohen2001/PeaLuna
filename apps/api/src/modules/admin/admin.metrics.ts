import type { OrderStatus } from '@velure/database';

export type DashboardPeriod = '7' | '30' | '90' | '365' | 'all';
export type SeriesGrain = 'day' | 'week' | 'month';
export type BookingBucket = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const PENDING_STATUSES: OrderStatus[] = [
  'SUBMITTED',
  'WAITING_FOR_TECHNICIAN',
  'WAITING_CUSTOMER_APPROVAL',
];

export const CONFIRMED_STATUSES: OrderStatus[] = [
  'ACCEPTED',
  'PICKUP_SCHEDULED',
  'RECEIVED',
  'IN_DIAGNOSIS',
  'IN_REPAIR',
  'QUALITY_CONTROL',
  'READY',
  'DELIVERY_SCHEDULED',
];

export const BOOKING_STATUSES: OrderStatus[] = [
  ...PENDING_STATUSES,
  ...CONFIRMED_STATUSES,
  'COMPLETED',
  'CANCELLED',
];

export function bookingBucket(status: OrderStatus): BookingBucket | null {
  if ((PENDING_STATUSES as string[]).includes(status)) return 'pending';
  if ((CONFIRMED_STATUSES as string[]).includes(status)) return 'confirmed';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  return null;
}

export function grainForPeriod(period: DashboardPeriod): SeriesGrain {
  if (period === '7' || period === '30') return 'day';
  if (period === '90') return 'week';
  return 'month';
}

export function daysForPeriod(period: Exclude<DashboardPeriod, 'all'>): number {
  return Number(period);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function periodStart(period: DashboardPeriod, now = new Date()): Date {
  if (period === 'all') {
    return new Date(Date.UTC(now.getUTCFullYear() - 3, now.getUTCMonth(), 1));
  }
  const start = startOfUtcDay(now);
  start.setUTCDate(start.getUTCDate() - (daysForPeriod(period) - 1));
  return start;
}

export function postgresBucketFormat(grain: SeriesGrain): string {
  if (grain === 'day') return 'YYYY-MM-DD';
  if (grain === 'week') return 'IYYY-"W"IW';
  return 'YYYY-MM';
}

export function seriesKeys(period: DashboardPeriod, since: Date, now = new Date()): string[] {
  const grain = grainForPeriod(period);
  const keys: string[] = [];
  const cursor = new Date(since.getTime());

  if (grain === 'day') {
    const end = startOfUtcDay(now);
    let day = startOfUtcDay(cursor);
    while (day <= end) {
      keys.push(day.toISOString().slice(0, 10));
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    }
    return keys;
  }

  if (grain === 'week') {
    const end = startOfUtcDay(now);
    let day = startOfUtcDay(cursor);
    const seen = new Set<string>();
    while (day <= end) {
      const key = isoWeekKey(day);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    }
    return keys;
  }

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  let month = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
  while (month <= end) {
    keys.push(month.toISOString().slice(0, 7));
    month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
  }
  return keys;
}

export function isoWeekKey(date: Date): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function fillSeries(
  keys: string[],
  rows: Array<{ bucket: string; value: number }>,
): Array<{ label: string; value: number }> {
  const map = new Map(rows.map((row) => [row.bucket, Number(row.value) || 0]));
  return keys.map((label) => ({ label, value: map.get(label) ?? 0 }));
}

export function averageBasketCents(gmvCents: number, paidCount: number): number {
  if (paidCount <= 0) return 0;
  return Math.round(gmvCents / paidCount);
}

export function cancellationRateBps(cancelled: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((cancelled / total) * 10_000);
}

export function completionRateBps(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 10_000);
}
