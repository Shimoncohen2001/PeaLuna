import { describe, expect, it } from 'vitest';
import { bookingTrackerState } from './booking-tracker.js';
import { OrderStatus } from './order-status.js';

describe('bookingTrackerState', () => {
  it('maps waiting for technician to step 0 (sent)', () => {
    expect(bookingTrackerState(OrderStatus.WAITING_FOR_TECHNICIAN)).toEqual({
      kind: 'active',
      step: 0,
    });
  });

  it('maps accepted to step 1', () => {
    expect(bookingTrackerState(OrderStatus.ACCEPTED)).toEqual({ kind: 'active', step: 1 });
  });

  it('maps pickup / in-repair to step 2 (in progress)', () => {
    expect(bookingTrackerState(OrderStatus.PICKUP_SCHEDULED)).toEqual({ kind: 'active', step: 2 });
    expect(bookingTrackerState(OrderStatus.IN_REPAIR)).toEqual({ kind: 'active', step: 2 });
  });

  it('maps completed to step 3', () => {
    expect(bookingTrackerState(OrderStatus.COMPLETED)).toEqual({ kind: 'active', step: 3 });
  });

  it('maps decline to rejected and cancel to cancelled', () => {
    expect(bookingTrackerState(OrderStatus.CANCELLED, 'DECLINE')).toEqual({ kind: 'rejected' });
    expect(bookingTrackerState(OrderStatus.CANCELLED, 'CANCEL')).toEqual({ kind: 'cancelled' });
  });
});
