import { prisma } from '@velure/database';
import type { Env } from '../../config/env.js';
import { isDiskMediaEnabled, previewPublicUrl } from './preview-store.js';
import { createS3Client, signedGetUrl } from './s3.js';

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
  const bucket = env.S3_BUCKET;
  const diskEnabled = isDiskMediaEnabled(env, Boolean(s3));

  return Promise.all(
    unique.map(async (row) => ({
      id: row.id,
      mimeType: row.mimeType,
      purpose: row.purpose,
      kind: row.mimeType.startsWith('video/') ? ('video' as const) : ('image' as const),
      url:
        s3 && bucket
          ? await signedGetUrl(s3, bucket, row.storageKey)
          : diskEnabled
            ? previewPublicUrl(env.WEB_ORIGIN, row.storageKey)
            : null,
      createdAt: row.createdAt.toISOString(),
    })),
  );
}
