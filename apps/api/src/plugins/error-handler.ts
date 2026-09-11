import { errorResponse } from '@velure/contracts';
import { DomainError, InvalidStateTransitionError } from '@velure/domain';
import type { AppInstance } from '../types/app.js';
import type { FastifyError } from 'fastify';

export async function registerErrorHandler(app: AppInstance): Promise<void> {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.requestId;

    if (error instanceof InvalidStateTransitionError) {
      return reply.status(409).send(
        errorResponse(error.code, error.message, requestId, {
          from: error.from,
          to: error.to,
          action: error.action,
        }),
      );
    }

    if (error instanceof DomainError) {
      return reply.status(422).send(errorResponse(error.code, error.message, requestId));
    }

    if (error.validation) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Request validation failed', requestId, {
          issues: error.validation,
        }),
      );
    }

    if (error.statusCode && error.statusCode < 500) {
      const extra = error as { code?: unknown; details?: unknown };
      const code = typeof extra.code === 'string' ? extra.code : 'REQUEST_ERROR';
      const details =
        extra.details && typeof extra.details === 'object'
          ? (Array.isArray(extra.details) ? { issues: extra.details } : (extra.details as Record<string, unknown>))
          : undefined;
      return reply.status(error.statusCode).send(errorResponse(code, error.message, requestId, details));
    }

    request.log.error({ err: error }, 'Unhandled error');
    return reply
      .status(500)
      .send(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', requestId));
  });
}
