import { createHash, randomBytes } from 'node:crypto';

/** Store only hashes of refresh tokens in the database */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateTokenFamilyId(): string {
  return randomBytes(16).toString('hex');
}

export function generateSessionId(): string {
  return randomBytes(16).toString('hex');
}
