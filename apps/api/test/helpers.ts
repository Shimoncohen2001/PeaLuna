import { prisma } from '@velure/database';
import type { Env } from '../src/config/env.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { generateWigReference } from '../src/lib/access.js';

export const TEST_PASSWORD = 'TestPassw0rd12';

export function testEnv(): Env {
  return {
    NODE_ENV: 'test',
    PORT: 4000,
    HOST: '0.0.0.0',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgresql://velure:velure_dev@localhost:5432/velure?schema=public',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
    JWT_ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters-long',
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-characters-long',
    CORS_ORIGIN: 'http://localhost:3000',
    COOKIE_SECURE: false,
    DEPLOYMENT_REGION: 'eu-central-1',
    AWS_REGION: 'eu-central-1',
    WEB_ORIGIN: 'http://localhost:3000',
    RATE_LIMIT_MAX: 1000,
    RATE_LIMIT_WINDOW_MS: 60_000,
    PREVIEW_MODE: false,
  };
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function ensureRoles() {
  for (const name of ['CUSTOMER', 'TECHNICIAN', 'OPS', 'ADMIN', 'SUPER_ADMIN'] as const) {
    await prisma.role.upsert({
      where: { name },
      create: { name, description: `${name} role` },
      update: {},
    });
  }
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${crypto.randomUUID()}@pealuna.test`;
}

export async function registerVerifiedCustomer(prefix = 'cust') {
  const auth = new AuthService(testEnv());
  const email = uniqueEmail(prefix);
  const session = await auth.register({
    email,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'Customer',
    countryCode: 'IL',
  });
  if (!session.verificationToken) {
    throw new Error('Expected verification token in test env');
  }
  await auth.verifyEmail(session.verificationToken);
  return { auth, email, session, userId: session.user.id };
}

export async function createServiceType(suffix: string) {
  return prisma.serviceType.create({
    data: {
      slug: `test-${suffix}-${crypto.randomUUID().slice(0, 8)}`,
      name: `Test service ${suffix}`,
      category: 'test',
      basePriceCents: 10_000,
      currency: 'ILS',
      estimatedDays: 1,
      estimatedMinutes: 45,
      isActive: true,
      sortOrder: 99,
    },
  });
}

export async function createWig(customerUserId: string) {
  const profile = await prisma.customerProfile.findUniqueOrThrow({
    where: { userId: customerUserId },
  });
  return prisma.wigProfile.create({
    data: {
      customerId: profile.id,
      reference: generateWigReference(),
      name: 'Test wig',
    },
  });
}

export async function deleteUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return;
  const customers = await prisma.customerProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const techs = await prisma.technicianProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const orderFilter = {
    OR: [
      { customerId: { in: customers.map((c) => c.id) } },
      { technicianId: { in: techs.map((t) => t.id) } },
    ],
  };
  const orderIds = (
    await prisma.repairOrder.findMany({ where: orderFilter, select: { id: true } })
  ).map((o) => o.id);
  if (orderIds.length > 0) {
    await prisma.transaction.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.platformCommission.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.repairOrder.deleteMany({ where: { id: { in: orderIds } } });
  }
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

export { prisma };
