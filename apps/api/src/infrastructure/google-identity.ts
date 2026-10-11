import { createRemoteJWKSet, jwtVerify } from 'jose';

export type GoogleProfile = {
  subject: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function httpError(message: string, statusCode: number, code: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

function splitName(given?: string, family?: string, full?: string) {
  const first = given?.trim() || full?.trim().split(/\s+/)[0] || 'PeaLuna';
  const last =
    family?.trim() ||
    full?.trim().split(/\s+/).slice(1).join(' ').trim() ||
    'Member';
  return { firstName: first.slice(0, 100), lastName: last.slice(0, 100) };
}

export function createGoogleVerifier(clientId: string): GoogleTokenVerifier {
  return {
    async verify(idToken: string) {
      let payload: Record<string, unknown>;
      try {
        const result = await jwtVerify(idToken, GOOGLE_JWKS, {
          issuer: GOOGLE_ISSUERS,
          audience: clientId,
        });
        payload = result.payload as Record<string, unknown>;
      } catch {
        throw httpError('Google sign-in failed', 401, 'GOOGLE_AUTH_FAILED');
      }

      const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
      const subject = typeof payload.sub === 'string' ? payload.sub : '';
      const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
      if (!email || !subject || !emailVerified) {
        throw httpError('Google did not share a verified email', 401, 'GOOGLE_EMAIL_UNVERIFIED');
      }

      const names = splitName(
        typeof payload.given_name === 'string' ? payload.given_name : undefined,
        typeof payload.family_name === 'string' ? payload.family_name : undefined,
        typeof payload.name === 'string' ? payload.name : undefined,
      );

      return {
        subject,
        email,
        emailVerified: true,
        firstName: names.firstName,
        lastName: names.lastName,
      };
    },
  };
}
