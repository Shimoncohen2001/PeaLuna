import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { listMediaForWigOrder } from '../src/modules/media/list-for-order.js';
import { writePreviewFile } from '../src/modules/media/preview-store.js';
import {
  createWig,
  deleteUsersByIds,
  ensureRoles,
  pingDatabase,
  prisma,
  registerVerifiedCustomer,
  testEnv,
} from './helpers.js';

const hasDb = await pingDatabase();

describe.skipIf(!hasDb)('media persistence', () => {
  const userIds: string[] = [];

  beforeAll(async () => {
    await ensureRoles();
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
  });

  it('stores a photo on disk and returns a retrievable URL', async () => {
    const customer = await registerVerifiedCustomer('media');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const key = `wigs/${wig.id}/${randomUUID()}.jpg`;
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await writePreviewFile(testEnv(), key, bytes);

    await prisma.wigAttachment.create({
      data: {
        wigId: wig.id,
        storageKey: key,
        mimeType: 'image/jpeg',
        fileSizeBytes: bytes.length,
        purpose: 'INTAKE',
        uploadedById: customer.userId,
      },
    });

    const items = await listMediaForWigOrder(testEnv(), wig.id, randomUUID());
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('image');
    expect(items[0]?.url).toContain('/api/v1/media/preview-file/');
    expect(items[0]?.url).toContain(encodeURIComponent(key));
  });
});
