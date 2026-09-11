import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@velure/contracts';
import type { Role } from '@velure/domain';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  email: string;
  roles: Role[];
  sessionId: string;
  type: 'access';
  /** Home region for data residency routing (multi-region future) */
  homeRegion: string;
}

export interface RefreshTokenClaims extends JWTPayload {
  sub: string;
  sessionId: string;
  familyId: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be set (min 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set (min 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(params: {
  userId: string;
  email: string;
  roles: Role[];
  sessionId: string;
  homeRegion: string;
}): Promise<string> {
  return new SignJWT({
    email: params.email,
    roles: params.roles,
    sessionId: params.sessionId,
    type: 'access',
    homeRegion: params.homeRegion,
  } satisfies Omit<AccessTokenClaims, 'sub' | 'iat' | 'exp'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer('pealuna')
    .setAudience('pealuna-api')
    .sign(getAccessSecret());
}

export async function signRefreshToken(params: {
  userId: string;
  sessionId: string;
  familyId: string;
}): Promise<string> {
  return new SignJWT({
    sessionId: params.sessionId,
    familyId: params.familyId,
    type: 'refresh',
  } satisfies Omit<RefreshTokenClaims, 'sub' | 'iat' | 'exp' | 'jti'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(params.userId)
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .setIssuer('pealuna')
    .setAudience('pealuna-api')
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    issuer: 'pealuna',
    audience: 'pealuna-api',
  });

  if (payload.type !== 'access' || !payload.sub) {
    throw new Error('Invalid access token');
  }

  return payload as AccessTokenClaims;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    issuer: 'pealuna',
    audience: 'pealuna-api',
  });

  if (payload.type !== 'refresh' || !payload.sub) {
    throw new Error('Invalid refresh token');
  }

  return payload as RefreshTokenClaims;
}

export async function createTokenPair(params: {
  userId: string;
  email: string;
  roles: Role[];
  sessionId: string;
  familyId: string;
  homeRegion: string;
}): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(params),
    signRefreshToken(params),
  ]);

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
  };
}
