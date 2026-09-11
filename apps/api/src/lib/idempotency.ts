import { createHash } from 'node:crypto';
import { prisma, Prisma } from '@velure/database';

const TTL_MS = 24 * 60 * 60 * 1000;

export function hashIdempotencyPayload(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
}

export function readIdempotencyKey(header: string | string[] | undefined): string | undefined {
  if (typeof header !== 'string') return undefined;
  const key = header.trim();
  if (key.length < 8 || key.length > 128) return undefined;
  return key;
}

export async function runIdempotent<T>(params: {
  userId: string;
  key: string;
  method: string;
  path: string;
  body: unknown;
  execute: () => Promise<{ statusCode: number; payload: T }>;
}): Promise<{ statusCode: number; payload: T; replayed: boolean }> {
  const requestHash = hashIdempotencyPayload(params.body);
  const existing = await prisma.idempotencyKey.findUnique({ where: { key: params.key } });
  if (existing) {
    if (existing.userId !== params.userId || existing.requestHash !== requestHash) {
      throw Object.assign(new Error('Idempotency key reused with a different request'), {
        statusCode: 409,
        code: 'IDEMPOTENCY_CONFLICT',
      });
    }
    if (existing.expiresAt.getTime() > Date.now()) {
      return {
        statusCode: existing.statusCode,
        payload: existing.response as T,
        replayed: true,
      };
    }
  }

  const result = await params.execute();
  try {
    await prisma.idempotencyKey.upsert({
      where: { key: params.key },
      create: {
        key: params.key,
        userId: params.userId,
        method: params.method,
        path: params.path,
        requestHash,
        statusCode: result.statusCode,
        response: result.payload as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
      update: {
        statusCode: result.statusCode,
        response: result.payload as Prisma.InputJsonValue,
        requestHash,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const raced = await prisma.idempotencyKey.findUniqueOrThrow({ where: { key: params.key } });
      return {
        statusCode: raced.statusCode,
        payload: raced.response as T,
        replayed: true,
      };
    }
    throw err;
  }
  return { ...result, replayed: false };
}

export async function withIdempotency<T>(params: {
  header: string | string[] | undefined;
  requireKey: boolean;
  userId: string;
  method: string;
  path: string;
  body: unknown;
  statusCode: number;
  execute: () => Promise<T>;
}): Promise<{ statusCode: number; payload: T }> {
  const key = readIdempotencyKey(params.header);
  if (!key) {
    if (params.requireKey) {
      throw Object.assign(new Error('Idempotency-Key header required'), {
        statusCode: 400,
        code: 'IDEMPOTENCY_KEY_REQUIRED',
      });
    }
    return { statusCode: params.statusCode, payload: await params.execute() };
  }
  return runIdempotent({
    userId: params.userId,
    key,
    method: params.method,
    path: params.path,
    body: params.body,
    execute: async () => ({ statusCode: params.statusCode, payload: await params.execute() }),
  });
}
