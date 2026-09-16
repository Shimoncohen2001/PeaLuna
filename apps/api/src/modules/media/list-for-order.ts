import { prisma } from '@velure/database';
import type { Env } from '../../config/env.js';
import { mediaPublicUrl } from './media-url.js';
import { createS3Client } from './s3.js';

export async function listMediaForWigOrder(env: Env, wigId: string, orderId: string) {
  const rows = await prisma.wigAttachment.findMany({
    where: {
      OR: [{ orderId }, { wigId, purpose: 'INTAKE' }],
    },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });

  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const s3 = createS3Client(env);

  return Promise.all(
    unique.map(async (row) => ({
      id: row.id,
      mimeType: row.mimeType,
      purpose: row.purpose,
      kind: row.mimeType.startsWith('video/') ? ('video' as const) : ('image' as const),
      url: await mediaPublicUrl(env, s3, row.storageKey),
      createdAt: row.createdAt.toISOString(),
    })),
  );
}
