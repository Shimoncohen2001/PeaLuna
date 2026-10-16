import { describe, expect, it } from 'vitest';
import {
  compareExpertRows,
  emptyExpertStats,
  finalizeExpertStats,
  statsByExpert,
} from './admin.experts.js';

describe('admin expert finance helpers', () => {
  it('does not treat a booking as a payment', () => {
    const stats = statsByExpert({
      orders: [
        {
          technicianId: 't1',
          status: 'ACCEPTED',
          paymentStatus: 'UNPAID',
          paymentMethod: 'CARD',
          totalCents: 10_000,
          platformFeeCents: 2_000,
          createdAt: '2026-04-01T00:00:00.000Z',
          completedAt: null,
          cashConfirmedAt: null,
        },
      ],
    });
    const row = stats.get('t1')!;
    expect(row.bookings).toBe(1);
    expect(row.paidCount).toBe(0);
    expect(row.gmvCents).toBe(0);
    expect(row.commissionCents).toBe(0);
    expect(row.expertShareCents).toBe(0);
  });

  it('splits captured card volume into gmv, commission and expert share', () => {
    const stats = statsByExpert({
      orders: [
        {
          technicianId: 't1',
          status: 'COMPLETED',
          paymentStatus: 'CAPTURED',
          paymentMethod: 'CARD',
          totalCents: 10_000,
          platformFeeCents: 2_000,
          createdAt: '2026-04-01T00:00:00.000Z',
          completedAt: '2026-04-02T00:00:00.000Z',
          cashConfirmedAt: null,
        },
      ],
      transfers: [
        { technicianId: 't1', amountCents: 8_000, createdAt: '2026-04-02T00:00:00.000Z' },
      ],
    });
    const row = stats.get('t1')!;
    expect(row.paidCount).toBe(1);
    expect(row.gmvCents).toBe(10_000);
    expect(row.commissionCents).toBe(2_000);
    expect(row.expertShareCents).toBe(8_000);
    expect(row.transferredCents).toBe(8_000);
    expect(row.cashKeptCents).toBe(0);
  });

  it('counts cash captured as kept by the expert, not a platform transfer', () => {
    const stats = statsByExpert({
      orders: [
        {
          technicianId: 't1',
          status: 'COMPLETED',
          paymentStatus: 'CAPTURED',
          paymentMethod: 'CASH',
          totalCents: 5_000,
          platformFeeCents: 1_000,
          createdAt: '2026-04-01T00:00:00.000Z',
          completedAt: '2026-04-02T00:00:00.000Z',
          cashConfirmedAt: '2026-04-02T00:00:00.000Z',
        },
      ],
      commissions: [
        {
          technicianId: 't1',
          commissionCents: 1_000,
          dueFromTechnician: true,
          settledAt: null,
        },
      ],
    });
    const row = stats.get('t1')!;
    expect(row.gmvCents).toBe(5_000);
    expect(row.expertShareCents).toBe(4_000);
    expect(row.cashKeptCents).toBe(4_000);
    expect(row.transferredCents).toBe(0);
    expect(row.cashCommissionDueCents).toBe(1_000);
    expect(row.cashCommissionSettledCents).toBe(0);
  });

  it('does not invent rates without bookings', () => {
    const stats = finalizeExpertStats(emptyExpertStats());
    expect(stats.cancellationRateBps).toBe(0);
    expect(stats.completionRateBps).toBe(0);
    expect(stats.averageBasketCents).toBe(0);
  });

  it('sorts by captured volume then stable id', () => {
    const rows = [
      {
        id: 'b',
        createdAt: '2026-01-02T00:00:00.000Z',
        bookings: 2,
        gmvCents: 100,
        commissionCents: 20,
        expertShareCents: 80,
        ratingAvg: 5,
        completionRateBps: 5000,
        cancellationRateBps: 0,
      },
      {
        id: 'a',
        createdAt: '2026-01-01T00:00:00.000Z',
        bookings: 9,
        gmvCents: 100,
        commissionCents: 20,
        expertShareCents: 80,
        ratingAvg: 4,
        completionRateBps: 9000,
        cancellationRateBps: 0,
      },
    ];
    const ranked = [...rows].sort((left, right) => compareExpertRows(left, right, 'gmv', 'desc'));
    expect(ranked.map((row) => row.id)).toEqual(['a', 'b']);
  });
});
