import { describe, expect, it } from 'vitest';
import { OrderStatus } from './order-status.js';
import { canAuthorizePayment, canReleaseEscrow } from './payment-eligibility.js';

describe('payment eligibility', () => {
  it('blocks authorization until the expert accepts', () => {
    expect(canAuthorizePayment(OrderStatus.WAITING_FOR_TECHNICIAN)).toBe(false);
    expect(canAuthorizePayment(OrderStatus.ACCEPTED)).toBe(true);
    expect(canAuthorizePayment(OrderStatus.PICKUP_SCHEDULED)).toBe(true);
  });

  it('allows escrow release only after completion while funds are held', () => {
    expect(canReleaseEscrow(OrderStatus.PICKUP_SCHEDULED, 'AUTHORIZED')).toBe(false);
    expect(canReleaseEscrow(OrderStatus.COMPLETED, 'UNPAID')).toBe(false);
    expect(canReleaseEscrow(OrderStatus.COMPLETED, 'AUTHORIZED')).toBe(true);
    expect(canReleaseEscrow(OrderStatus.COMPLETED, 'CAPTURED')).toBe(false);
  });
});
