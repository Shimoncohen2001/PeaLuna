import { successResponse } from '@velure/contracts';
import { prisma } from '@velure/database';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { checkRedisConnection, getRedis } from '../../infrastructure/redis.js';

export async function healthRoutes(app: AppInstance, env: Env): Promise<void> {
  app.get('/health/live', async (request, reply) => {
    return reply.send(successResponse({ status: 'ok' }, request.requestId));
  });

  app.get('/health/ready', async (request, reply) => {
    let dbOk = false;
    let redisOk = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const redis = getRedis(env);
    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      redisOk = await checkRedisConnection(redis);
    } catch {
      redisOk = false;
    }

    const ready = dbOk && redisOk;
    const body = successResponse(
      {
        status: ready ? 'ready' : 'degraded',
        checks: { database: dbOk, redis: redisOk },
        region: env.DEPLOYMENT_REGION,
      },
      request.requestId,
    );

    return reply.status(ready ? 200 : 503).send(body);
  });
}
