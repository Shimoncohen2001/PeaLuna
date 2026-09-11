import { describe, expect, it } from 'vitest';
import {
  calculatePlatformCommissionCents,
  calculateTechnicianPayoutCents,
} from './commission.js';

describe('commission', () => {
  it('calculates 20% platform fee', () => {
    expect(calculatePlatformCommissionCents(10_000)).toBe(2_000);
    expect(calculateTechnicianPayoutCents(10_000)).toBe(8_000);
  });

  it('uses integer math for odd amounts', () => {
    expect(calculatePlatformCommissionCents(999)).toBe(199);
  });
});
