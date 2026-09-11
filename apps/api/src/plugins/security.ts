import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import type { AppInstance } from '../types/app.js';
import type { Env } from '../config/env.js';
import { getRedis } from '../infrastructure/redis.js';

export async function registerSecurity(app: AppInstance, env: Env): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET ?? env.JWT_REFRESH_SECRET,
    parseOptions: {},
  });

  let redisClient: ReturnType<typeof getRedis> | undefined;
  try {
    const redis = getRedis(env);
    await redis.connect();
    redisClient = redis;
  } catch {
    if (env.NODE_ENV === 'production') {
      throw new Error('Redis is required in production for rate limiting');
    }
    app.log.warn('Redis unavailable — using in-memory rate limit store');
  }

  await app.register(rateLimit, {
    max: (request) => {
      const url = request.url.split('?')[0] ?? '';
      if (url.endsWith('/auth/login') || url.endsWith('/auth/register')) return 10;
      if (url.endsWith('/auth/refresh')) return 30;
      return env.RATE_LIMIT_MAX;
    },
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    ...(redisClient ? { redis: redisClient } : {}),
    keyGenerator: (request) => {
      const userId = request.user?.sub;
      return userId ?? request.ip;
    },
  });
}
