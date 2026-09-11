import { PLATFORM_COMMISSION_BPS } from '@velure/contracts';

export { PLATFORM_COMMISSION_BPS };

/**
 * Calculate platform commission in minor currency units (cents).
 * Uses integer math to avoid floating-point errors.
 */
export function calculatePlatformCommissionCents(grossAmountCents: number): number {
  if (grossAmountCents < 0) {
    throw new Error('grossAmountCents must be non-negative');
  }
  return Math.floor((grossAmountCents * PLATFORM_COMMISSION_BPS) / 10_000);
}

export function calculateTechnicianPayoutCents(grossAmountCents: number): number {
  return grossAmountCents - calculatePlatformCommissionCents(grossAmountCents);
}
