import { prisma } from '@velure/database';

const FLAG = 'wipe_fake_marketplace_2026_10_23';

type Logger = {
  info: (obj: Record<string, unknown>, msg: string) => void;
  warn: (obj: Record<string, unknown>, msg: string) => void;
};

function isRailwayProduction(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  const url = process.env.DATABASE_URL ?? '';
  return /railway|rlwy\.net/i.test(url);
}

export async function wipeFakeMarketplaceOnce(log: Logger): Promise<void> {
  if (!isRailwayProduction()) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ops_flags (
      key TEXT PRIMARY KEY,
      done_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await prisma.$queryRaw<Array<{ done_at: Date }>>`
    SELECT done_at FROM ops_flags WHERE key = ${FLAG}
  `;
  if (existing.length > 0) {
    log.info({ flag: FLAG }, 'Fake marketplace wipe already applied');
    return;
  }

  const [users, experts, orders, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.technicianProfile.count(),
    prisma.repairOrder.count(),
    prisma.review.count(),
  ]);
  log.warn({ users, experts, orders, reviews }, 'Wiping fake marketplace data');

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      reviews,
      platform_commissions,
      transactions,
      stripe_events,
      messages,
      message_threads,
      care_operations,
      care_reports,
      order_workflow_progress,
      order_line_items,
      order_status_history,
      order_milestones,
      pickup_deliveries,
      wig_attachments,
      repair_orders,
      wig_profiles,
      technician_services,
      technician_skills,
      technician_availability,
      technician_profiles,
      customer_profiles,
      notifications,
      refresh_tokens,
      email_verification_tokens,
      auth_identities,
      user_roles,
      idempotency_keys,
      audit_logs,
      outbox_events,
      users
    RESTART IDENTITY CASCADE
  `);

  await prisma.$executeRawUnsafe(
    `INSERT INTO ops_flags (key) VALUES ('${FLAG}') ON CONFLICT (key) DO NOTHING`,
  );

  const afterUsers = await prisma.user.count();
  const afterServices = await prisma.serviceType.count();
  if (afterUsers !== 0) {
    throw new Error('Wipe incomplete: users remain');
  }
  if (afterServices === 0) {
    throw new Error('Catalog was wiped');
  }

  log.warn({ afterUsers, afterServices }, 'Fake marketplace data removed; catalog kept');
}
