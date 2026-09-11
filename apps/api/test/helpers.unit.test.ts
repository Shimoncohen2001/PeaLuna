import { describe, expect, it } from 'vitest';
import { hashIdempotencyPayload, readIdempotencyKey } from '../src/lib/idempotency.js';
import { createMailer, getCapturedMail, clearCapturedMail, verificationEmail } from '../src/infrastructure/mailer.js';
import { testEnv } from './helpers.js';

describe('idempotency helpers', () => {
  it('hashes the same payload consistently', () => {
    expect(hashIdempotencyPayload({ a: 1 })).toBe(hashIdempotencyPayload({ a: 1 }));
    expect(hashIdempotencyPayload({ a: 1 })).not.toBe(hashIdempotencyPayload({ a: 2 }));
  });

  it('rejects short idempotency keys', () => {
    expect(readIdempotencyKey('abc')).toBeUndefined();
    expect(readIdempotencyKey('stable-booking-key')).toBe('stable-booking-key');
  });
});

describe('mailer', () => {
  it('captures verification mail in test mode', async () => {
    clearCapturedMail();
    const mailer = createMailer(testEnv());
    const message = verificationEmail({
      to: 'ada@pealuna.test',
      firstName: 'Ada',
      verifyUrl: 'http://localhost:3000/verify-email?token=abc',
    });
    await mailer.send(message);
    const captured = getCapturedMail();
    expect(captured).toHaveLength(1);
    expect(captured[0]?.to).toBe('ada@pealuna.test');
    expect(captured[0]?.text).toContain('verify-email');
  });
});
