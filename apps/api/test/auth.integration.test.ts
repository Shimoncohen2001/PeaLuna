import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service.js';
import {
  deleteUsersByIds,
  ensureRoles,
  pingDatabase,
  prisma,
  TEST_PASSWORD,
  testEnv,
  uniqueEmail,
} from './helpers.js';

const hasDb = await pingDatabase();

describe.skipIf(!hasDb)('auth integration', () => {
  const userIds: string[] = [];
  const auth = new AuthService(testEnv());

  beforeAll(async () => {
    await ensureRoles();
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
  });

  it('registers as pending, then verifies email', async () => {
    const session = await auth.register({
      email: uniqueEmail('verify'),
      password: TEST_PASSWORD,
      firstName: 'Ada',
      lastName: 'Verify',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);

    const pending = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    expect(pending.status).toBe('PENDING_VERIFICATION');
    expect(pending.emailVerifiedAt).toBeNull();
    expect(session.user.emailVerified).toBe(false);
    expect(session.verificationToken).toBeTruthy();

    await auth.verifyEmail(session.verificationToken!);

    const active = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    expect(active.status).toBe('ACTIVE');
    expect(active.emailVerifiedAt).toBeTruthy();
  });

  it('rejects a reused verification token', async () => {
    const session = await auth.register({
      email: uniqueEmail('reuse-mail'),
      password: TEST_PASSWORD,
      firstName: 'Reuse',
      lastName: 'Mail',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);
    await auth.verifyEmail(session.verificationToken!);
    await expect(auth.verifyEmail(session.verificationToken!)).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_TOKEN',
    });
  });

  it('rotates a refresh token and rejects the previous one without killing the family', async () => {
    const session = await auth.register({
      email: uniqueEmail('refresh'),
      password: TEST_PASSWORD,
      firstName: 'Ray',
      lastName: 'Fresh',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);

    const rotated = await auth.refresh({ refreshToken: session.refreshToken });
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    await expect(auth.refresh({ refreshToken: session.refreshToken })).rejects.toMatchObject({
      code: 'INVALID_REFRESH',
    });

    const again = await auth.refresh({ refreshToken: rotated.refreshToken });
    expect(again.accessToken).toBeTruthy();
  });

  it('revokes the family when an ancestor token is replayed after a later rotation', async () => {
    const session = await auth.register({
      email: uniqueEmail('reuse'),
      password: TEST_PASSWORD,
      firstName: 'Rea',
      lastName: 'Use',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);

    const rotated = await auth.refresh({ refreshToken: session.refreshToken });
    const later = await auth.refresh({ refreshToken: rotated.refreshToken });

    await expect(auth.refresh({ refreshToken: session.refreshToken })).rejects.toMatchObject({
      code: 'TOKEN_REUSE',
    });
    await expect(auth.refresh({ refreshToken: later.refreshToken })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('allows only one winner when the same refresh token is rotated concurrently', async () => {
    const session = await auth.register({
      email: uniqueEmail('race'),
      password: TEST_PASSWORD,
      firstName: 'Race',
      lastName: 'Token',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);

    const results = await Promise.allSettled([
      auth.refresh({ refreshToken: session.refreshToken }),
      auth.refresh({ refreshToken: session.refreshToken }),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const winner = (ok[0] as PromiseFulfilledResult<{ refreshToken: string }>).value;
    const next = await auth.refresh({ refreshToken: winner.refreshToken });
    expect(next.accessToken).toBeTruthy();
  });

  it('creates a verified customer from Google and reuses the same account', async () => {
    const email = uniqueEmail('google');
    const googleAuth = new AuthService(testEnv(), undefined, {
      async verify() {
        return {
          subject: `sub-${email}`,
          email,
          emailVerified: true,
          firstName: 'Gita',
          lastName: 'Cohen',
        };
      },
    });
    const session = await googleAuth.loginWithGoogle({ idToken: 'google-id-token-placeholder' });
    userIds.push(session.user.id);
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.email).toBe(email);

    const again = await googleAuth.loginWithGoogle({ idToken: 'google-id-token-placeholder' });
    expect(again.user.id).toBe(session.user.id);
  });

  it('links Google to an existing password account and confirms the email', async () => {
    const email = uniqueEmail('link-g');
    const session = await auth.register({
      email,
      password: TEST_PASSWORD,
      firstName: 'Ada',
      lastName: 'Link',
      countryCode: 'IL',
    });
    userIds.push(session.user.id);
    expect(session.user.emailVerified).toBe(false);

    const googleAuth = new AuthService(testEnv(), undefined, {
      async verify() {
        return {
          subject: `sub-link-${email}`,
          email,
          emailVerified: true,
          firstName: 'Ada',
          lastName: 'Link',
        };
      },
    });
    const linked = await googleAuth.loginWithGoogle({ idToken: 'google-id-token-placeholder' });
    expect(linked.user.id).toBe(session.user.id);
    expect(linked.user.emailVerified).toBe(true);
  });
});
