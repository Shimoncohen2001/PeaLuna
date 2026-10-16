import type { OrderStatus } from '@velure/database';
import {
  averageBasketCents,
  bookingBucket,
  cancellationRateBps,
  completionRateBps,
} from './admin.metrics.js';

export type ExpertSortBy =
  | 'createdAt'
  | 'bookings'
  | 'gmv'
  | 'commission'
  | 'payout'
  | 'rating'
  | 'completedRate'
  | 'cancellationRate';

export type ExpertOrderRow = {
  technicianId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalCents: number;
  platformFeeCents: number;
  createdAt: Date | string;
  completedAt: Date | string | null;
  cashConfirmedAt: Date | string | null;
};

export type ExpertTransferRow = {
  technicianId: string;
  amountCents: number;
  createdAt: Date | string;
};

export type ExpertCommissionRow = {
  technicianId: string;
  commissionCents: number;
  dueFromTechnician: boolean;
  settledAt: Date | string | null;
};

export type ExpertStats = {
  bookings: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  paidCount: number;
  gmvCents: number;
  commissionCents: number;
  expertShareCents: number;
  transferredCents: number;
  cashKeptCents: number;
  cashCommissionDueCents: number;
  cashCommissionSettledCents: number;
  averageBasketCents: number;
  cancellationRateBps: number;
  completionRateBps: number;
  lastBookingAt: string | null;
};

export function emptyExpertStats(): ExpertStats {
  return {
    bookings: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    paidCount: 0,
    gmvCents: 0,
    commissionCents: 0,
    expertShareCents: 0,
    transferredCents: 0,
    cashKeptCents: 0,
    cashCommissionDueCents: 0,
    cashCommissionSettledCents: 0,
    averageBasketCents: 0,
    cancellationRateBps: 0,
    completionRateBps: 0,
    lastBookingAt: null,
  };
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toISOString();
}

export function captureAt(row: Pick<ExpertOrderRow, 'completedAt' | 'cashConfirmedAt' | 'createdAt'>): string {
  return toIso(row.completedAt) ?? toIso(row.cashConfirmedAt) ?? toIso(row.createdAt)!;
}

export function isCapturedPayment(row: Pick<ExpertOrderRow, 'paymentStatus'>): boolean {
  return row.paymentStatus === 'CAPTURED';
}

export function accumulateExpertBooking(stats: ExpertStats, row: ExpertOrderRow): void {
  const bucket = bookingBucket(row.status as OrderStatus);
  if (!bucket) return;
  stats.bookings += 1;
  if (bucket === 'pending') stats.pending += 1;
  else if (bucket === 'confirmed') stats.confirmed += 1;
  else if (bucket === 'completed') stats.completed += 1;
  else if (bucket === 'cancelled') stats.cancelled += 1;
  const at = toIso(row.createdAt);
  if (at && (!stats.lastBookingAt || at > stats.lastBookingAt)) stats.lastBookingAt = at;
}

export function accumulateExpertPayment(stats: ExpertStats, row: ExpertOrderRow): void {
  if (!isCapturedPayment(row)) return;
  const share = row.totalCents - row.platformFeeCents;
  stats.paidCount += 1;
  stats.gmvCents += row.totalCents;
  stats.commissionCents += row.platformFeeCents;
  stats.expertShareCents += share;
  if (row.paymentMethod === 'CASH') stats.cashKeptCents += share;
}

export function accumulateExpertTransfer(stats: ExpertStats, row: ExpertTransferRow): void {
  stats.transferredCents += row.amountCents;
}

export function accumulateExpertCommission(stats: ExpertStats, row: ExpertCommissionRow): void {
  if (!row.dueFromTechnician) return;
  if (row.settledAt) stats.cashCommissionSettledCents += row.commissionCents;
  else stats.cashCommissionDueCents += row.commissionCents;
}

export function finalizeExpertStats(stats: ExpertStats): ExpertStats {
  stats.averageBasketCents = averageBasketCents(stats.gmvCents, stats.paidCount);
  stats.cancellationRateBps = cancellationRateBps(stats.cancelled, stats.bookings);
  stats.completionRateBps = completionRateBps(stats.completed, stats.bookings);
  return stats;
}

export function statsByExpert(input: {
  orders: ExpertOrderRow[];
  transfers?: ExpertTransferRow[];
  commissions?: ExpertCommissionRow[];
  bookingSince?: Date | null;
  paymentSince?: Date | null;
}): Map<string, ExpertStats> {
  const map = new Map<string, ExpertStats>();
  const bookingSinceIso = input.bookingSince?.toISOString() ?? null;
  const paymentSinceIso = input.paymentSince?.toISOString() ?? null;

  for (const row of input.orders) {
    const stats = map.get(row.technicianId) ?? emptyExpertStats();
    const created = toIso(row.createdAt);
    if (!bookingSinceIso || (created && created >= bookingSinceIso)) {
      accumulateExpertBooking(stats, row);
    }
    const captured = captureAt(row);
    if (isCapturedPayment(row) && (!paymentSinceIso || captured >= paymentSinceIso)) {
      accumulateExpertPayment(stats, row);
    }
    map.set(row.technicianId, stats);
  }

  for (const row of input.transfers ?? []) {
    const at = toIso(row.createdAt);
    if (paymentSinceIso && (!at || at < paymentSinceIso)) continue;
    const stats = map.get(row.technicianId) ?? emptyExpertStats();
    accumulateExpertTransfer(stats, row);
    map.set(row.technicianId, stats);
  }

  for (const row of input.commissions ?? []) {
    const stats = map.get(row.technicianId) ?? emptyExpertStats();
    accumulateExpertCommission(stats, row);
    map.set(row.technicianId, stats);
  }

  for (const stats of map.values()) finalizeExpertStats(stats);
  return map;
}

export function compareExpertRows(
  a: {
    id: string;
    createdAt: string;
    bookings: number;
    gmvCents: number;
    commissionCents: number;
    expertShareCents: number;
    ratingAvg: number;
    completionRateBps: number;
    cancellationRateBps: number;
  },
  b: typeof a,
  sortBy: ExpertSortBy,
  sortOrder: 'asc' | 'desc',
): number {
  const dir = sortOrder === 'asc' ? 1 : -1;
  let cmp = 0;
  if (sortBy === 'bookings') cmp = a.bookings - b.bookings;
  else if (sortBy === 'gmv') cmp = a.gmvCents - b.gmvCents;
  else if (sortBy === 'commission') cmp = a.commissionCents - b.commissionCents;
  else if (sortBy === 'payout') cmp = a.expertShareCents - b.expertShareCents;
  else if (sortBy === 'rating') cmp = a.ratingAvg - b.ratingAvg;
  else if (sortBy === 'completedRate') cmp = a.completionRateBps - b.completionRateBps;
  else if (sortBy === 'cancellationRate') cmp = a.cancellationRateBps - b.cancellationRateBps;
  else cmp = a.createdAt.localeCompare(b.createdAt);
  if (cmp === 0) return a.id.localeCompare(b.id);
  return cmp * dir;
}
