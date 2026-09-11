import { createLogger } from '@velure/logger';
import type { Env } from '../config/env.js';

export function createApiLogger(env: Env) {
  return createLogger({
    name: 'pealuna-api',
    pretty: env.NODE_ENV === 'development',
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  });
}
