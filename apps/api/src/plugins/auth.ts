import { verifyAccessToken, type AccessTokenClaims } from '@velure/auth';
import type { AppInstance } from '../types/app.js';
import type { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenClaims;
  }
}

export async function registerAuth(app: AppInstance): Promise<void> {
  app.decorateRequest('user', undefined);

  app.decorate(
    'authenticate',
    async function authenticate(request: FastifyRequest): Promise<void> {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw app.httpErrors.unauthorized('Missing or invalid authorization header');
      }
      const token = header.slice(7);
      try {
        request.user = await verifyAccessToken(token);
      } catch {
        throw app.httpErrors.unauthorized('Invalid or expired access token');
      }
    },
  );
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}
