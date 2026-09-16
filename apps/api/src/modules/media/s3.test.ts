import { describe, expect, it } from 'vitest';
import type { Env } from '../../config/env.js';
import { createS3Client } from './s3.js';

function env(overrides: Partial<Env>): Env {
  return {
    NODE_ENV: 'production',
    AWS_REGION: 'eu-central-1',
    S3_BUCKET: 'velure-media',
    S3_ACCESS_KEY: 'key',
    S3_SECRET_KEY: 'secret',
    ...overrides,
  } as Env;
}

describe('createS3Client', () => {
  it('returns null when credentials are missing', () => {
    expect(createS3Client(env({ S3_ACCESS_KEY: undefined }))).toBeNull();
  });

  it('ignores a leftover local MinIO endpoint on a deployed instance', () => {
    expect(createS3Client(env({ S3_ENDPOINT: 'http://localhost:9000' }))).toBeNull();
    expect(createS3Client(env({ S3_ENDPOINT: 'http://127.0.0.1:9000' }))).toBeNull();
  });

  it('keeps a local endpoint outside production so dev keeps using MinIO', () => {
    expect(
      createS3Client(env({ NODE_ENV: 'development', S3_ENDPOINT: 'http://localhost:9000' })),
    ).not.toBeNull();
  });

  it('builds a client for a real endpoint', () => {
    expect(
      createS3Client(env({ S3_ENDPOINT: 'https://account.r2.cloudflarestorage.com' })),
    ).not.toBeNull();
  });
});
