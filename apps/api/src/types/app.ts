import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/** Shared Fastify instance type for route modules and plugins */
export type AppInstance = FastifyInstance<any, any, any, any, ZodTypeProvider>;
