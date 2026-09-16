import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Env } from '../../config/env.js';

const KEY_RE =
  /^wigs\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|mp4|webm|mov)$/i;

export type MediaStoreEnv = Pick<Env, 'MEDIA_DIR'>;

function rootDir(env: MediaStoreEnv) {
  // Without MEDIA_DIR the files live in the container temp dir and are lost on redeploy.
  return env.MEDIA_DIR ? join(env.MEDIA_DIR, 'media') : join(tmpdir(), 'pealuna-media');
}

export function isDiskMediaEnabled(
  env: Pick<Env, 'NODE_ENV' | 'PREVIEW_MODE' | 'MEDIA_DIR'>,
  hasS3: boolean,
) {
  if (hasS3) return false;
  return Boolean(env.MEDIA_DIR) || Boolean(env.PREVIEW_MODE) || env.NODE_ENV !== 'production';
}

export function isDurableDiskMedia(env: MediaStoreEnv): boolean {
  return Boolean(env.MEDIA_DIR);
}

export async function ensureMediaRoot(env: MediaStoreEnv): Promise<string> {
  const dir = rootDir(env);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function assertPreviewStorageKey(key: string): string {
  if (!KEY_RE.test(key)) {
    throw Object.assign(new Error('Invalid storage key'), {
      statusCode: 400,
      code: 'INVALID_STORAGE_KEY',
    });
  }
  return key;
}

function filePath(env: MediaStoreEnv, key: string) {
  return join(rootDir(env), ...assertPreviewStorageKey(key).split('/'));
}

export async function writePreviewFile(
  env: MediaStoreEnv,
  key: string,
  body: Buffer,
): Promise<void> {
  const path = filePath(env, key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

export async function previewFileExists(env: MediaStoreEnv, key: string): Promise<boolean> {
  try {
    const info = await stat(filePath(env, key));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

export async function readPreviewFile(env: MediaStoreEnv, key: string): Promise<Buffer> {
  return readFile(filePath(env, key));
}

export function previewPublicUrl(webOrigin: string, key: string): string {
  return `${webOrigin.replace(/\/$/, '')}/api/v1/media/preview-file/${encodeURIComponent(key)}`;
}
