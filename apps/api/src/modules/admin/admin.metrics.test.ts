import { describe, expect, it } from 'vitest';
import {
  averageBasketCents,
  bookingBucket,
  cancellationRateBps,
  fillSeries,
  grainForPeriod,
  periodStart,
  seriesKeys,
} from './admin.metrics.js';

describe('admin dashboard metrics', () => {
  it('maps order statuses into booking buckets', () => {
    expect(bookingBucket('WAITING_FOR_TECHNICIAN')).toBe('pending');
    expect(bookingBucket('ACCEPTED')).toBe('confirmed');
    expect(bookingBucket('COMPLETED')).toBe('completed');
    expect(bookingBucket('CANCELLED')).toBe('cancelled');
    expect(bookingBucket('DRAFT')).toBeNull();
  });

  it('picks a coarser grain for longer periods', () => {
    expect(grainForPeriod('7')).toBe('day');
    expect(grainForPeriod('30')).toBe('day');
    expect(grainForPeriod('90')).toBe('week');
    expect(grainForPeriod('365')).toBe('month');
    expect(grainForPeriod('all')).toBe('month');
  });

  it('does not invent basket or cancellation values without orders', () => {
    expect(averageBasketCents(0, 0)).toBe(0);
    expect(cancellationRateBps(0, 0)).toBe(0);
    expect(averageBasketCents(10_000, 2)).toBe(5000);
    expect(cancellationRateBps(1, 4)).toBe(2500);
  });

  it('fills missing series days with zero instead of fabricated values', () => {
    const filled = fillSeries(['2026-10-01', '2026-10-02', '2026-10-03'], [
      { bucket: '2026-10-02', value: 3 },
    ]);
    expect(filled).toEqual([
      { label: '2026-10-01', value: 0 },
      { label: '2026-10-02', value: 3 },
      { label: '2026-10-03', value: 0 },
    ]);
  });

  it('builds a 7-day key range inclusive of today', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const since = periodStart('7', now);
    const keys = seriesKeys('7', since, now);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-10-07');
    expect(keys[6]).toBe('2026-10-13');
  });
});
