import { describe, expect, it } from 'vitest';
import { OrderStatus } from './order-status.js';
import {
  canAuthorizePayment,
  canChooseCashPayment,
  canConfirmCashPayment,
  canReleaseEscrow,
} from './payment-eligibility.js';

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

  it('offers cash only when the expert accepts it and nothing is engaged', () => {
    expect(canChooseCashPayment(OrderStatus.ACCEPTED, 'UNPAID', true)).toBe(true);
    expect(canChooseCashPayment(OrderStatus.ACCEPTED, 'FAILED', true)).toBe(true);
    expect(canChooseCashPayment(OrderStatus.ACCEPTED, 'UNPAID', false)).toBe(false);
    expect(canChooseCashPayment(OrderStatus.WAITING_FOR_TECHNICIAN, 'UNPAID', true)).toBe(false);
    expect(canChooseCashPayment(OrderStatus.ACCEPTED, 'AUTHORIZED', true)).toBe(false);
    expect(canChooseCashPayment(OrderStatus.ACCEPTED, 'CASH_PENDING', true)).toBe(false);
  });

  it('lets the expert confirm cash only once the job is complete', () => {
    expect(canConfirmCashPayment(OrderStatus.COMPLETED, 'CASH_PENDING')).toBe(true);
    expect(canConfirmCashPayment(OrderStatus.ACCEPTED, 'CASH_PENDING')).toBe(false);
    expect(canConfirmCashPayment(OrderStatus.COMPLETED, 'UNPAID')).toBe(false);
    expect(canConfirmCashPayment(OrderStatus.COMPLETED, 'CAPTURED')).toBe(false);
  });
});
