/**
 * Repair order lifecycle states.
 * Keep in sync with Prisma enum `OrderStatus`.
 */
export const OrderStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  WAITING_FOR_TECHNICIAN: 'WAITING_FOR_TECHNICIAN',
  ACCEPTED: 'ACCEPTED',
  PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
  RECEIVED: 'RECEIVED',
  IN_DIAGNOSIS: 'IN_DIAGNOSIS',
  WAITING_CUSTOMER_APPROVAL: 'WAITING_CUSTOMER_APPROVAL',
  IN_REPAIR: 'IN_REPAIR',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  READY: 'READY',
  DELIVERY_SCHEDULED: 'DELIVERY_SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.ARCHIVED,
]);

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.has(status);
}
