import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { loadEnv } from './config/env.js';
import { createApiLogger } from './infrastructure/observability.js';
import { registerRequestContext } from './plugins/request-context.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerSecurity } from './plugins/security.js';
import { registerAuth } from './plugins/auth.js';
import { healthRoutes } from './modules/health/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { serviceRoutes } from './modules/services/routes.js';
import { wigRoutes } from './modules/wigs/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { mediaRoutes } from './modules/media/routes.js';
import { technicianRoutes } from './modules/technicians/routes.js';
import { paymentRoutes } from './modules/payments/routes.js';
import { reviewRoutes } from './modules/reviews/routes.js';
import { careReportRoutes } from './modules/care-reports/routes.js';
import type { AppInstance } from './types/app.js';

export async function buildApp() {
  const env = loadEnv();
  const logger = createApiLogger(env);

  const app = Fastify({
    loggerInstance: logger,
    trustProxy: 1,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    bodyLimit: 52 * 1024 * 1024,
  }).withTypeProvider<ZodTypeProvider>() as AppInstance;

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(sensible);
  await registerRequestContext(app);
  await registerErrorHandler(app);
  await registerSecurity(app, env);
  await registerAuth(app);

  await healthRoutes(app, env);
  await authRoutes(app, env);
  await serviceRoutes(app);
  await wigRoutes(app);
  await orderRoutes(app, env);
  await mediaRoutes(app, env);
  await technicianRoutes(app, env);
  await paymentRoutes(app, env);
  await reviewRoutes(app);
  await careReportRoutes(app, env);

  app.get('/', async (_request, reply) => {
    return reply.send({
      name: 'PeaLuna API',
      version: '0.3.0',
      region: env.DEPLOYMENT_REGION,
      docs: '/api/v1',
    });
  });

  return { app, env };
}
