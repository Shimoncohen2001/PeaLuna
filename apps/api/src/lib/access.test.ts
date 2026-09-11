import { describe, expect, it } from 'vitest';
import { toOrderActorRole } from './access.js';

describe('toOrderActorRole', () => {
  it('keeps customer surface as CUSTOMER even when JWT also has TECHNICIAN', () => {
    expect(toOrderActorRole(['CUSTOMER', 'TECHNICIAN'], 'customer')).toBe('CUSTOMER');
  });

  it('uses TECHNICIAN only on technician routes', () => {
    expect(toOrderActorRole(['CUSTOMER', 'TECHNICIAN'], 'technician')).toBe('TECHNICIAN');
  });

  it('still elevates admins on customer routes', () => {
    expect(toOrderActorRole(['CUSTOMER', 'ADMIN'], 'customer')).toBe('ADMIN');
  });
});
