import { randomBytes } from 'node:crypto';
import {
  createTokenPair,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  generateSessionId,
  generateTokenFamilyId,
} from '@velure/auth';
import { ACCESS_TOKEN_TTL_SECONDS } from '@velure/contracts';
import { prisma, UserStatus } from '@velure/database';
import type { Role } from '@velure/domain';
import type { Env } from '../../config/env.js';
import { createMailer, verificationEmail, type Mailer } from '../../infrastructure/mailer.js';

type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  homeRegion: string;
};

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function httpError(message: string, statusCode: number, code: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

export class AuthService {
  private readonly mailer: Mailer;

  constructor(
    private readonly env: Env,
    mailer?: Mailer,
  ) {
    this.mailer = mailer ?? createMailer(env);
  }

  async register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const email = params.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw httpError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(params.password);
    const customerRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'CUSTOMER' },
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: params.firstName,
        lastName: params.lastName,
        countryCode: params.countryCode,
        locale: params.countryCode === 'IL' ? 'he-IL' : 'en-GB',
        timezone: params.countryCode === 'IL' ? 'Asia/Jerusalem' : 'UTC',
        homeRegion: this.env.DEPLOYMENT_REGION,
        status: UserStatus.PENDING_VERIFICATION,
        roles: { create: { roleId: customerRole.id } },
        customerProfile: { create: {} },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    const session = await this.issueSession(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: this.mapRoles(user.roles),
        homeRegion: user.homeRegion,
      },
      params.userAgent,
      params.ipAddress,
    );

    const verificationToken = await this.issueEmailVerificationToken(user.id);
    await this.dispatchVerificationEmail(user.email, user.firstName, verificationToken);

    return {
      ...session,
      emailVerified: false,
      verificationToken:
        this.env.NODE_ENV === 'production' && !this.env.PREVIEW_MODE
          ? undefined
          : verificationToken,
    };
  }

  async login(params: { email: string; password: string; userAgent?: string; ipAddress?: string }) {
    const email = params.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw httpError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(params.password, user.passwordHash);
    if (!valid) {
      throw httpError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    return this.issueSession(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: this.mapRoles(user.roles),
        homeRegion: user.homeRegion,
      },
      params.userAgent,
      params.ipAddress,
    );
  }

  /**
   * Rotate refresh token (same familyId + sessionId).
   * Presenting a just-rotated token is INVALID_REFRESH (concurrent loser).
   * Presenting an ancestor after a later rotation revokes the family (theft).
   */
  async refresh(params: {
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    let claims;
    try {
      claims = await verifyRefreshToken(params.refreshToken);
    } catch {
      throw httpError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }

    const tokenHash = hashRefreshToken(params.refreshToken);
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (
      !row ||
      row.userId !== claims.sub ||
      row.familyId !== claims.familyId ||
      row.sessionId !== claims.sessionId
    ) {
      throw httpError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      throw httpError('Refresh token expired', 401, 'REFRESH_EXPIRED');
    }

    if (row.revokedAt) {
      const otherRevoked = await prisma.refreshToken.findFirst({
        where: {
          familyId: row.familyId,
          id: { not: row.id },
          revokedAt: { not: null },
        },
        select: { id: true },
      });
      if (otherRevoked) {
        await prisma.refreshToken.updateMany({
          where: { familyId: row.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw httpError('Refresh token reuse detected', 401, 'TOKEN_REUSE');
      }
      throw httpError('Refresh token already rotated', 401, 'INVALID_REFRESH');
    }

    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw httpError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: this.mapRoles(user.roles),
      homeRegion: user.homeRegion,
    };

    const tokens = await createTokenPair({
      userId: sessionUser.id,
      email: sessionUser.email,
      roles: sessionUser.roles,
      sessionId: claims.sessionId,
      familyId: claims.familyId,
      homeRegion: sessionUser.homeRegion,
    });

    const expiresAt = new Date(Date.now() + tokens.refreshExpiresIn * 1000);

    const claimed = await prisma.$transaction(async (tx) => {
      const result = await tx.refreshToken.updateMany({
        where: { id: row.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count === 0) {
        return false;
      }
      await tx.refreshToken.create({
        data: {
          userId: sessionUser.id,
          tokenHash: hashRefreshToken(tokens.refreshToken),
          familyId: claims.familyId,
          sessionId: claims.sessionId,
          expiresAt,
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
        },
      });
      return true;
    });

    if (!claimed) {
      throw httpError('Refresh token already rotated', 401, 'INVALID_REFRESH');
    }

    return {
      accessToken: tokens.accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: tokens.refreshToken,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        firstName: sessionUser.firstName,
        lastName: sessionUser.lastName,
        roles: sessionUser.roles as string[],
      },
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = hashRefreshToken(token);
    const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!row || row.consumedAt) {
      throw httpError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw httpError('Verification token expired', 400, 'VERIFICATION_EXPIRED');
    }

    const claimed = await prisma.emailVerificationToken.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw httpError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    await prisma.user.update({
      where: { id: row.userId },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.emailVerificationToken.updateMany({
      where: { userId: row.userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    return { verified: true as const };
  }

  async resendVerification(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw httpError('User not found', 404, 'USER_NOT_FOUND');
    }
    if (user.emailVerifiedAt || user.status === UserStatus.ACTIVE) {
      return { alreadyVerified: true as const };
    }

    const verificationToken = await this.issueEmailVerificationToken(user.id);
    await this.dispatchVerificationEmail(user.email, user.firstName, verificationToken);
    return {
      alreadyVerified: false as const,
      verificationToken:
        this.env.NODE_ENV === 'production' && !this.env.PREVIEW_MODE
          ? undefined
          : verificationToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    const tokenHash = hashRefreshToken(refreshToken);
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!row) return;

    await prisma.refreshToken.updateMany({
      where: { familyId: row.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueSession(
    user: SessionUser,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const sessionId = generateSessionId();
    const familyId = generateTokenFamilyId();

    const tokens = await createTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      sessionId,
      familyId,
      homeRegion: user.homeRegion,
    });

    const expiresAt = new Date(Date.now() + tokens.refreshExpiresIn * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(tokens.refreshToken),
        familyId,
        sessionId,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return {
      accessToken: tokens.accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles as string[],
      },
    };
  }

  private async issueEmailVerificationToken(userId: string): Promise<string> {
    await prisma.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      },
    });
    return token;
  }

  private async dispatchVerificationEmail(email: string, firstName: string, token: string) {
    const verifyUrl = `${this.env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
    const message = verificationEmail({ to: email, firstName, verifyUrl });
    try {
      await this.mailer.send(message);
    } catch (err) {
      if (this.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  private mapRoles(userRoles: { role: { name: string } }[]): Role[] {
    return userRoles.map((ur) => ur.role.name as Role);
  }
}
