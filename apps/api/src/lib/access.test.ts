import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { normalizeAllowedMime } from '@velure/contracts';
import { roundPublicCoord, toOrderActorRole } from './access.js';
import {
  assertPreviewStorageKey,
  isDiskMediaEnabled,
  readPreviewFile,
  writePreviewFile,
} from '../modules/media/preview-store.js';

describe('toOrderActorRole', () => {
  it('keeps customer surface as CUSTOMER even when JWT also has TECHNICIAN', () => {
    expect(toOrderActorRole(['CUSTOMER', 'TECHNICIAN'], 'customer')).toBe('CUSTOMER');
  });

  it('uses TECHNICIAN only on technician routes', () => {
    expect(toOrderActorRole(['CUSTOMER', 'TECHNICIAN'], 'technician')).toBe('TECHNICIAN');
  });

  it('still elevates admins on customer routes', () => {
    expect(toOrderActorRole(['CUSTOMER', 'ADMIN'], 'customer')).toBe('ADMIN');
  });
});

describe('roundPublicCoord', () => {
  it('rounds to about a kilometre', () => {
    expect(roundPublicCoord(32.0853)).toBe(32.09);
    expect(roundPublicCoord(34.7818)).toBe(34.78);
    expect(roundPublicCoord(null)).toBeNull();
  });
});

describe('normalizeAllowedMime', () => {
  it('accepts iPhone camera aliases', () => {
    expect(normalizeAllowedMime('image/jpg')).toBe('image/jpeg');
    expect(normalizeAllowedMime('image/pjpeg')).toBe('image/jpeg');
    expect(normalizeAllowedMime('image/heic')).toBe('image/heic');
    expect(normalizeAllowedMime('image/heic-sequence')).toBe('image/heic');
    expect(normalizeAllowedMime('image/heif-sequence')).toBe('image/heif');
    expect(normalizeAllowedMime('application/pdf')).toBeNull();
  });
});

describe('preview disk store', () => {
  it('writes and reads a jpeg, and rejects a bad key', async () => {
    const key = `wigs/${randomUUID()}/${randomUUID()}.jpg`;
    const body = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await writePreviewFile(key, body);
    expect(await readPreviewFile(key)).toEqual(body);
    expect(() => assertPreviewStorageKey('../secret.txt')).toThrow();
  });

  it('uses disk when S3 is missing outside production', () => {
    expect(isDiskMediaEnabled({ NODE_ENV: 'test', PREVIEW_MODE: false }, false)).toBe(true);
    expect(isDiskMediaEnabled({ NODE_ENV: 'production', PREVIEW_MODE: true }, false)).toBe(true);
    expect(isDiskMediaEnabled({ NODE_ENV: 'production', PREVIEW_MODE: false }, false)).toBe(false);
    expect(isDiskMediaEnabled({ NODE_ENV: 'test', PREVIEW_MODE: false }, true)).toBe(false);
  });
});
