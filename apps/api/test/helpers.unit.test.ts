import { describe, expect, it } from 'vitest';
import { hashIdempotencyPayload, readIdempotencyKey } from '../src/lib/idempotency.js';
import {
  createMailer,
  getCapturedMail,
  clearCapturedMail,
  verificationEmail,
  resolveResendFrom,
  RESEND_TEST_FROM,
} from '../src/infrastructure/mailer.js';
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

  it('maps Resend sandbox and localhost from-addresses to onboarding@resend.dev', () => {
    expect(resolveResendFrom(undefined)).toBe(RESEND_TEST_FROM);
    expect(resolveResendFrom('PeaLuna <noreply@localhost>')).toBe(RESEND_TEST_FROM);
    expect(resolveResendFrom('PeaLuna <beth.t@example.com>')).toBe(RESEND_TEST_FROM);
    expect(resolveResendFrom('"PeaLuna <onboarding@resend.dev>"')).toBe(RESEND_TEST_FROM);
    expect(resolveResendFrom('PeaLuna <hello@pealuna.com>')).toBe('PeaLuna <hello@pealuna.com>');
  });

  it('retries with the Resend test sender when a custom from is rejected', async () => {
    const froms: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (_url, init) => {
      const body = JSON.parse(String((init as RequestInit).body)) as { from: string };
      froms.push(body.from);
      if (body.from.includes('pealuna.com')) {
        return new Response(
          JSON.stringify({
            statusCode: 403,
            message: 'The pealuna.com domain is not verified. Please, add and verify your domain',
          }),
          { status: 403 },
        );
      }
      return new Response(JSON.stringify({ id: 'email_ok' }), { status: 200 });
    }) as typeof fetch;
    try {
      const mailer = createMailer({
        ...testEnv(),
        RESEND_API_KEY: 're_test_key_xxxxxxxx',
        EMAIL_FROM: 'PeaLuna <hello@pealuna.com>',
      });
      await mailer.send({ to: 'owner@gmail.com', subject: 'Hi', text: 'Hi' });
      expect(froms).toEqual(['PeaLuna <hello@pealuna.com>', RESEND_TEST_FROM]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
