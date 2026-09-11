import { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

let redis: Redis | null = null;

export function getRedis(env: Env): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function checkRedisConnection(client: Redis): Promise<boolean> {
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
