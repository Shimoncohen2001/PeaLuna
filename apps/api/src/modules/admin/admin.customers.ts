import type { OrderStatus } from '@velure/database';
import { averageBasketCents, bookingBucket } from './admin.metrics.js';

export type CustomerSortBy = 'createdAt' | 'bookings' | 'spent';

export type CustomerOrderStatRow = {
  customerId: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: Date | string;
};

export type CustomerStats = {
  bookings: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  completed: number;
  spentCents: number;
  paidCount: number;
  averageBasketCents: number;
  lastBookingAt: string | null;
};

export function customerSearchTokens(q?: string): string[] {
  return (q ?? '')
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .slice(0, 6);
}

export function emptyCustomerStats(): CustomerStats {
  return {
    bookings: 0,
    cancelled: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    spentCents: 0,
    paidCount: 0,
    averageBasketCents: 0,
    lastBookingAt: null,
  };
}

export function accumulateCustomerOrder(stats: CustomerStats, row: CustomerOrderStatRow): void {
  const bucket = bookingBucket(row.status as OrderStatus);
  if (!bucket) return;

  stats.bookings += 1;
  if (bucket === 'cancelled') stats.cancelled += 1;
  else if (bucket === 'pending') stats.pending += 1;
  else if (bucket === 'confirmed') stats.confirmed += 1;
  else if (bucket === 'completed') stats.completed += 1;

  if (row.paymentStatus === 'CAPTURED') {
    stats.spentCents += row.totalCents;
    stats.paidCount += 1;
  }

  const at = typeof row.createdAt === 'string' ? row.createdAt : row.createdAt.toISOString();
  if (!stats.lastBookingAt || at > stats.lastBookingAt) {
    stats.lastBookingAt = at;
  }
}

export function finalizeCustomerStats(stats: CustomerStats): CustomerStats {
  stats.averageBasketCents = averageBasketCents(stats.spentCents, stats.paidCount);
  return stats;
}

export function statsByCustomer(rows: CustomerOrderStatRow[]): Map<string, CustomerStats> {
  const map = new Map<string, CustomerStats>();
  for (const row of rows) {
    const current = map.get(row.customerId) ?? emptyCustomerStats();
    accumulateCustomerOrder(current, row);
    map.set(row.customerId, current);
  }
  for (const stats of map.values()) {
    finalizeCustomerStats(stats);
  }
  return map;
}

export function compareCustomerRows(
  a: { id: string; createdAt: string; bookings: number; spentCents: number },
  b: { id: string; createdAt: string; bookings: number; spentCents: number },
  sortBy: CustomerSortBy,
  sortOrder: 'asc' | 'desc',
): number {
  const dir = sortOrder === 'asc' ? 1 : -1;
  let cmp = 0;
  if (sortBy === 'bookings') cmp = a.bookings - b.bookings;
  else if (sortBy === 'spent') cmp = a.spentCents - b.spentCents;
  else cmp = a.createdAt.localeCompare(b.createdAt);
  if (cmp === 0) return a.id.localeCompare(b.id);
  return cmp * dir;
}
