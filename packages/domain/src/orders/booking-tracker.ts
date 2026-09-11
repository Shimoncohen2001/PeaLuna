import { OrderStatus, type OrderStatus as OrderStatusType } from './order-status.js';

/** 0 sent → 1 accepted → 2 in progress → 3 completed */
export type BookingTrackerStep = 0 | 1 | 2 | 3;

export type BookingTrackerState =
  | { kind: 'active'; step: BookingTrackerStep }
  | { kind: 'cancelled' }
  | { kind: 'rejected' };

const SENT: ReadonlySet<string> = new Set([
  OrderStatus.DRAFT,
  OrderStatus.SUBMITTED,
  OrderStatus.WAITING_FOR_TECHNICIAN,
]);

const ACCEPTED: ReadonlySet<string> = new Set([OrderStatus.ACCEPTED]);

const COMPLETED: ReadonlySet<string> = new Set([OrderStatus.COMPLETED, OrderStatus.ARCHIVED]);

/**
 * Maps existing RepairOrder.status onto a 4-step client tracker.
 * Technician DECLINE is stored as CANCELLED; pass lastAction to distinguish reject.
 */
export function bookingTrackerState(
  status: OrderStatusType | string,
  lastAction?: string | null,
): BookingTrackerState {
  if (status === OrderStatus.CANCELLED) {
    return lastAction === 'DECLINE' ? { kind: 'rejected' } : { kind: 'cancelled' };
  }
  if (SENT.has(status)) return { kind: 'active', step: 0 };
  if (ACCEPTED.has(status)) return { kind: 'active', step: 1 };
  if (COMPLETED.has(status)) return { kind: 'active', step: 3 };
  return { kind: 'active', step: 2 };
}
