import { prisma } from '@velure/database';

const FLAG = 'promote_owner_2026_10_23';
const OWNER_EMAIL = 'shimoncohen524@gmail.com';
const OWNER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'CUSTOMER'] as const;

type Logger = {
  info: (obj: Record<string, unknown>, msg: string) => void;
  warn: (obj: Record<string, unknown>, msg: string) => void;
};

function isRailwayProduction(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  const url = process.env.DATABASE_URL ?? '';
  return /railway|rlwy\.net/i.test(url);
}

async function ensureFlagsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ops_flags (
      key TEXT PRIMARY KEY,
      done_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function alreadyDone(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ done_at: Date }>>`
    SELECT done_at FROM ops_flags WHERE key = ${FLAG}
  `;
  return rows.length > 0;
}

async function markDone(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO ops_flags (key) VALUES ('${FLAG}') ON CONFLICT (key) DO NOTHING`,
  );
}

export async function promoteOwnerOnce(log: Logger): Promise<boolean> {
  if (!isRailwayProduction()) return true;

  await ensureFlagsTable();
  if (await alreadyDone()) {
    log.info({ flag: FLAG }, 'Owner admin promote already applied');
    return true;
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: OWNER_EMAIL, mode: 'insensitive' } },
  });
  if (!user) {
    log.warn({ email: OWNER_EMAIL }, 'Owner account not registered yet');
    return false;
  }

  const roles = await prisma.role.findMany({
    where: { name: { in: [...OWNER_ROLES] } },
  });

  for (const role of roles) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  await markDone();
  log.warn({ email: OWNER_EMAIL, userId: user.id }, 'Owner promoted to admin');
  return true;
}

export function startOwnerPromote(log: Logger): void {
  if (!isRailwayProduction()) return;

  void promoteOwnerOnce(log);
  const startedAt = Date.now();
  const timer = setInterval(() => {
    void (async () => {
      const done = await promoteOwnerOnce(log);
      const expired = Date.now() - startedAt > 24 * 60 * 60 * 1000;
      if (done || expired) clearInterval(timer);
    })();
  }, 20_000);
}
