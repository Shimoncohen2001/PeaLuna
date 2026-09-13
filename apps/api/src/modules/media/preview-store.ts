import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const KEY_RE =
  /^wigs\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|mp4|webm|mov)$/i;

function rootDir() {
  return join(tmpdir(), 'pealuna-media');
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

function filePath(key: string) {
  return join(rootDir(), ...assertPreviewStorageKey(key).split('/'));
}

export async function writePreviewFile(key: string, body: Buffer): Promise<void> {
  const path = filePath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

export async function previewFileExists(key: string): Promise<boolean> {
  try {
    const info = await stat(filePath(key));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

export async function readPreviewFile(key: string): Promise<Buffer> {
  return readFile(filePath(key));
}

export function previewPublicUrl(webOrigin: string, key: string): string {
  return `${webOrigin.replace(/\/$/, '')}/api/v1/media/preview-file/${encodeURIComponent(key)}`;
}
