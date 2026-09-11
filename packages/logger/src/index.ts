import pino from 'pino';

export type Logger = pino.Logger;

export interface CreateLoggerOptions {
  name: string;
  level?: string;
  pretty?: boolean;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return pino({
    name: options.name,
    level: options.level ?? (isProduction ? 'info' : 'debug'),
    ...(options.pretty && !isProduction
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
    redact: {
      paths: [
        'password',
        'passwordHash',
        'token',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
    base: {
      service: options.name,
      region: process.env.DEPLOYMENT_REGION ?? 'eu-central-1',
      env: process.env.NODE_ENV ?? 'development',
    },
  });
}

export function childWithRequestId(logger: Logger, requestId: string): Logger {
  return logger.child({ requestId });
}
