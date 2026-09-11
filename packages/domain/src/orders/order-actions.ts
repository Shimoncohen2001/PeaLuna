/**
 * Explicit actions that trigger state transitions.
 * API accepts actions, not raw target statuses — prevents invalid jumps.
 */
export const OrderAction = {
  SUBMIT: 'SUBMIT',
  ASSIGN_TECHNICIAN: 'ASSIGN_TECHNICIAN',
  ACCEPT: 'ACCEPT',
  DECLINE: 'DECLINE',
  SCHEDULE_PICKUP: 'SCHEDULE_PICKUP',
  CONFIRM_RECEIVED: 'CONFIRM_RECEIVED',
  START_DIAGNOSIS: 'START_DIAGNOSIS',
  REQUEST_CUSTOMER_APPROVAL: 'REQUEST_CUSTOMER_APPROVAL',
  APPROVE_ESTIMATE: 'APPROVE_ESTIMATE',
  START_REPAIR: 'START_REPAIR',
  SUBMIT_FOR_QC: 'SUBMIT_FOR_QC',
  PASS_QC: 'PASS_QC',
  MARK_READY: 'MARK_READY',
  SCHEDULE_DELIVERY: 'SCHEDULE_DELIVERY',
  COMPLETE: 'COMPLETE',
  CANCEL: 'CANCEL',
  ARCHIVE: 'ARCHIVE',
} as const;

export type OrderAction = (typeof OrderAction)[keyof typeof OrderAction];

export type OrderActorRole =
  | 'CUSTOMER'
  | 'TECHNICIAN'
  | 'ADMIN'
  | 'OPS'
  | 'SYSTEM';
