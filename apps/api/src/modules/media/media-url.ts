import type { S3Client } from '@aws-sdk/client-s3';
import type { Env } from '../../config/env.js';
import { isDiskMediaEnabled, previewPublicUrl } from './preview-store.js';
import { signedGetUrl } from './s3.js';

/** Resolves the URL a client can use to fetch a stored media file. */
export async function mediaPublicUrl(
  env: Env,
  s3: S3Client | null,
  storageKey: string,
): Promise<string | null> {
  if (s3 && env.S3_BUCKET) {
    return signedGetUrl(s3, env.S3_BUCKET, storageKey);
  }
  if (isDiskMediaEnabled(env, Boolean(s3))) {
    return previewPublicUrl(env.WEB_ORIGIN, storageKey);
  }
  return null;
}
