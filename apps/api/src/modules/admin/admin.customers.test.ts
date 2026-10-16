import { describe, expect, it } from 'vitest';
import {
  compareCustomerRows,
  customerSearchTokens,
  emptyCustomerStats,
  finalizeCustomerStats,
  statsByCustomer,
} from './admin.customers.js';

describe('admin customer helpers', () => {
  it('splits a name or email search into at most six tokens', () => {
    expect(customerSearchTokens('  Shimon Cohen  ')).toEqual(['Shimon', 'Cohen']);
    expect(customerSearchTokens('')).toEqual([]);
    expect(customerSearchTokens('a b c d e f g h')).toHaveLength(6);
  });

  it('counts captured spend and ignores drafts', () => {
    const stats = statsByCustomer([
      {
        customerId: 'a',
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        totalCents: 9000,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        customerId: 'a',
        status: 'COMPLETED',
        paymentStatus: 'CAPTURED',
        totalCents: 4000,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      {
        customerId: 'a',
        status: 'CANCELLED',
        paymentStatus: 'VOIDED',
        totalCents: 2000,
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      {
        customerId: 'b',
        status: 'ACCEPTED',
        paymentStatus: 'CAPTURED',
        totalCents: 1500,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ]);

    const a = stats.get('a')!;
    expect(a.bookings).toBe(2);
    expect(a.cancelled).toBe(1);
    expect(a.completed).toBe(1);
    expect(a.spentCents).toBe(4000);
    expect(a.paidCount).toBe(1);
    expect(a.averageBasketCents).toBe(4000);
    expect(a.lastBookingAt).toBe('2026-03-01T00:00:00.000Z');
    expect(stats.get('b')?.spentCents).toBe(1500);
  });

  it('sorts by spend then by stable id', () => {
    const rows = [
      { id: 'b', createdAt: '2026-01-02T00:00:00.000Z', bookings: 1, spentCents: 100 },
      { id: 'a', createdAt: '2026-01-01T00:00:00.000Z', bookings: 3, spentCents: 100 },
      { id: 'c', createdAt: '2026-01-03T00:00:00.000Z', bookings: 0, spentCents: 500 },
    ];
    const spent = [...rows].sort((left, right) => compareCustomerRows(left, right, 'spent', 'desc'));
    expect(spent.map((row) => row.id)).toEqual(['c', 'a', 'b']);
    const newest = [...rows].sort((left, right) =>
      compareCustomerRows(left, right, 'createdAt', 'desc'),
    );
    expect(newest.map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });

  it('does not invent an average basket without captured payments', () => {
    const stats = finalizeCustomerStats(emptyCustomerStats());
    expect(stats.averageBasketCents).toBe(0);
  });
});
