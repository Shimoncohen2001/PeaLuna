import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { AppInstance } from '../types/app.js';
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

export async function registerRequestContext(app: AppInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const incoming = request.headers['x-request-id'];
    request.requestId =
      typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    (request as FastifyRequest & { startedAt: number }).startedAt = Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = (request as FastifyRequest & { startedAt?: number }).startedAt;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;
    request.log.info(
      {
        requestId: request.requestId,
        method: request.method,
        url: request.url.split('?')[0],
        statusCode: reply.statusCode,
        durationMs,
      },
      'request.completed',
    );
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.requestId);
    return payload;
  });
}
