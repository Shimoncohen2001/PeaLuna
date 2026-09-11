import { describe, expect, it } from 'vitest';
import { InvalidStateTransitionError } from '../errors.js';
import { OrderAction } from './order-actions.js';
import { OrderStatus } from './order-status.js';
import { getAvailableActions, resolveTransition } from './order-state-machine.js';

describe('order state machine', () => {
  it('allows customer to submit draft', () => {
    const t = resolveTransition(OrderStatus.DRAFT, OrderAction.SUBMIT, 'CUSTOMER');
    expect(t.to).toBe(OrderStatus.SUBMITTED);
  });

  it('allows technician to accept when waiting', () => {
    const t = resolveTransition(
      OrderStatus.WAITING_FOR_TECHNICIAN,
      OrderAction.ACCEPT,
      'TECHNICIAN',
    );
    expect(t.to).toBe(OrderStatus.ACCEPTED);
  });

  it('rejects invalid transition', () => {
    expect(() =>
      resolveTransition(OrderStatus.DRAFT, OrderAction.COMPLETE, 'CUSTOMER'),
    ).toThrow(InvalidStateTransitionError);
  });

  it('rejects wrong role for action', () => {
    expect(() =>
      resolveTransition(OrderStatus.WAITING_FOR_TECHNICIAN, OrderAction.ACCEPT, 'CUSTOMER'),
    ).toThrow(InvalidStateTransitionError);
  });

  it('allows technician to decline when waiting', () => {
    const t = resolveTransition(
      OrderStatus.WAITING_FOR_TECHNICIAN,
      OrderAction.DECLINE,
      'TECHNICIAN',
    );
    expect(t.to).toBe(OrderStatus.CANCELLED);
  });

  it('allows technician to schedule pickup after accept', () => {
    const t = resolveTransition(OrderStatus.ACCEPTED, OrderAction.SCHEDULE_PICKUP, 'TECHNICIAN');
    expect(t.to).toBe(OrderStatus.PICKUP_SCHEDULED);
  });

  it('allows technician to complete an accepted appointment', () => {
    const t = resolveTransition(OrderStatus.ACCEPTED, OrderAction.COMPLETE, 'TECHNICIAN');
    expect(t.to).toBe(OrderStatus.COMPLETED);
  });

  it('allows technician to complete a scheduled appointment', () => {
    const t = resolveTransition(OrderStatus.PICKUP_SCHEDULED, OrderAction.COMPLETE, 'TECHNICIAN');
    expect(t.to).toBe(OrderStatus.COMPLETED);
  });

  it('does not let a customer complete an accepted appointment', () => {
    expect(() =>
      resolveTransition(OrderStatus.ACCEPTED, OrderAction.COMPLETE, 'CUSTOMER'),
    ).toThrow(InvalidStateTransitionError);
  });

  it('lists COMPLETE for technician but not customer on accepted jobs', () => {
    expect(getAvailableActions(OrderStatus.ACCEPTED, 'TECHNICIAN')).toContain(OrderAction.COMPLETE);
    expect(getAvailableActions(OrderStatus.ACCEPTED, 'CUSTOMER')).not.toContain(OrderAction.COMPLETE);
  });
});

