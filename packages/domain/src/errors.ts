export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(
    readonly from: string,
    readonly to: string,
    readonly action?: string,
  ) {
    super(
      `Invalid order transition from ${from} to ${to}${action ? ` (action: ${action})` : ''}`,
      'INVALID_STATE_TRANSITION',
    );
    this.name = 'InvalidStateTransitionError';
  }
}
