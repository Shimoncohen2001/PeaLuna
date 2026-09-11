import { InvalidStateTransitionError } from '../errors.js';
import type { OrderAction, OrderActorRole } from './order-actions.js';
import { OrderStatus, type OrderStatus as OrderStatusType } from './order-status.js';

export interface TransitionDefinition {
  from: OrderStatusType;
  to: OrderStatusType;
  action: OrderAction;
  allowedRoles: readonly OrderActorRole[];
}

/**
 * Authoritative transition table — single source of truth for order lifecycle.
 */
export const ORDER_TRANSITIONS: readonly TransitionDefinition[] = [
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.SUBMITTED,
    action: 'SUBMIT',
    allowedRoles: ['CUSTOMER'],
  },
  {
    from: OrderStatus.SUBMITTED,
    to: OrderStatus.WAITING_FOR_TECHNICIAN,
    action: 'ASSIGN_TECHNICIAN',
    allowedRoles: ['SYSTEM', 'ADMIN', 'OPS'],
  },
  {
    from: OrderStatus.WAITING_FOR_TECHNICIAN,
    to: OrderStatus.ACCEPTED,
    action: 'ACCEPT',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.WAITING_FOR_TECHNICIAN,
    to: OrderStatus.CANCELLED,
    action: 'DECLINE',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.ACCEPTED,
    to: OrderStatus.PICKUP_SCHEDULED,
    action: 'SCHEDULE_PICKUP',
    allowedRoles: ['CUSTOMER', 'OPS', 'ADMIN', 'TECHNICIAN'],
  },
  {
    from: OrderStatus.ACCEPTED,
    to: OrderStatus.COMPLETED,
    action: 'COMPLETE',
    allowedRoles: ['TECHNICIAN', 'OPS', 'ADMIN'],
  },
  {
    from: OrderStatus.PICKUP_SCHEDULED,
    to: OrderStatus.COMPLETED,
    action: 'COMPLETE',
    allowedRoles: ['TECHNICIAN', 'OPS', 'ADMIN'],
  },
  {
    from: OrderStatus.PICKUP_SCHEDULED,
    to: OrderStatus.RECEIVED,
    action: 'CONFIRM_RECEIVED',
    allowedRoles: ['TECHNICIAN', 'OPS', 'ADMIN'],
  },
  {
    from: OrderStatus.RECEIVED,
    to: OrderStatus.IN_DIAGNOSIS,
    action: 'START_DIAGNOSIS',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.IN_DIAGNOSIS,
    to: OrderStatus.WAITING_CUSTOMER_APPROVAL,
    action: 'REQUEST_CUSTOMER_APPROVAL',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.WAITING_CUSTOMER_APPROVAL,
    to: OrderStatus.IN_REPAIR,
    action: 'APPROVE_ESTIMATE',
    allowedRoles: ['CUSTOMER'],
  },
  {
    from: OrderStatus.IN_DIAGNOSIS,
    to: OrderStatus.IN_REPAIR,
    action: 'START_REPAIR',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.IN_REPAIR,
    to: OrderStatus.QUALITY_CONTROL,
    action: 'SUBMIT_FOR_QC',
    allowedRoles: ['TECHNICIAN'],
  },
  {
    from: OrderStatus.QUALITY_CONTROL,
    to: OrderStatus.READY,
    action: 'PASS_QC',
    allowedRoles: ['ADMIN', 'OPS', 'TECHNICIAN'],
  },
  {
    from: OrderStatus.READY,
    to: OrderStatus.DELIVERY_SCHEDULED,
    action: 'SCHEDULE_DELIVERY',
    allowedRoles: ['CUSTOMER', 'OPS', 'ADMIN'],
  },
  {
    from: OrderStatus.DELIVERY_SCHEDULED,
    to: OrderStatus.COMPLETED,
    action: 'COMPLETE',
    allowedRoles: ['SYSTEM', 'OPS', 'ADMIN', 'TECHNICIAN'],
  },
  {
    from: OrderStatus.COMPLETED,
    to: OrderStatus.ARCHIVED,
    action: 'ARCHIVE',
    allowedRoles: ['SYSTEM', 'ADMIN'],
  },
  // Cancellation from non-terminal states
  ...([
    OrderStatus.DRAFT,
    OrderStatus.SUBMITTED,
    OrderStatus.WAITING_FOR_TECHNICIAN,
    OrderStatus.ACCEPTED,
    OrderStatus.PICKUP_SCHEDULED,
    OrderStatus.IN_DIAGNOSIS,
    OrderStatus.WAITING_CUSTOMER_APPROVAL,
  ] as const).map(
    (from): TransitionDefinition => ({
      from,
      to: OrderStatus.CANCELLED,
      action: 'CANCEL',
      allowedRoles: ['CUSTOMER', 'ADMIN', 'OPS'],
    }),
  ),
];

const transitionIndex = new Map<string, TransitionDefinition>();

for (const t of ORDER_TRANSITIONS) {
  transitionIndex.set(`${t.from}:${t.action}`, t);
}

export function resolveTransition(
  currentStatus: OrderStatusType,
  action: OrderAction,
  actorRole: OrderActorRole,
): TransitionDefinition {
  const key = `${currentStatus}:${action}`;
  const transition = transitionIndex.get(key);

  if (!transition) {
    throw new InvalidStateTransitionError(currentStatus, 'UNKNOWN', action);
  }

  if (!transition.allowedRoles.includes(actorRole)) {
    throw new InvalidStateTransitionError(currentStatus, transition.to, action);
  }

  return transition;
}

export function getAvailableActions(
  currentStatus: OrderStatusType,
  actorRole: OrderActorRole,
): OrderAction[] {
  return ORDER_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(actorRole),
  ).map((t) => t.action);
}
