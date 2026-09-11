import { OrderStatus, type OrderStatus as OrderStatusType } from './order-status.js';

/** Statuses where the customer may not pay yet (expert has not accepted). */
const PAYMENT_BLOCKED_STATUSES: ReadonlySet<OrderStatusType> = new Set([
  OrderStatus.DRAFT,
  OrderStatus.SUBMITTED,
  OrderStatus.WAITING_FOR_TECHNICIAN,
  OrderStatus.CANCELLED,
  OrderStatus.ARCHIVED,
]);

/**
 * Escrow payment is allowed only after the technician has accepted the booking.
 * Accept often advances to ACCEPTED then PICKUP_SCHEDULED — both are allowed.
 */
export function canAuthorizePayment(status: OrderStatusType | string): boolean {
  return !PAYMENT_BLOCKED_STATUSES.has(status as OrderStatusType);
}

const APPOINTMENT_COMPLETE_STATUSES: ReadonlySet<OrderStatusType> = new Set([
  OrderStatus.ACCEPTED,
  OrderStatus.PICKUP_SCHEDULED,
  OrderStatus.DELIVERY_SCHEDULED,
]);

/** On-site marketplace jobs can be marked done after the expert accepted. */
export function canMarkAppointmentComplete(status: OrderStatusType | string): boolean {
  return APPOINTMENT_COMPLETE_STATUSES.has(status as OrderStatusType);
}

/**
 * Customer may capture escrow only after the technician has closed the job.
 * Payment must still be in AUTHORIZED (held) state.
 */
export function canReleaseEscrow(
  status: OrderStatusType | string,
  paymentStatus: string,
): boolean {
  return status === OrderStatus.COMPLETED && paymentStatus === 'AUTHORIZED';
}
