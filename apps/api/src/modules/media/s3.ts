import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../../config/env.js';

export function createS3Client(env: Env): S3Client | null {
  if (!env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
    return null;
  }

  return new S3Client({
    region: env.AWS_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
  });
}

export async function signedPutUrl(
  s3: S3Client,
  bucket: string,
  key: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
  });
  return getSignedUrl(s3, command, { expiresIn: 600 });
}

export async function headObject(
  s3: S3Client,
  bucket: string,
  key: string,
) {
  return s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}

export async function signedGetUrl(s3: S3Client, bucket: string, key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
}

export async function putObject(
  s3: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  mimeType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      ContentLength: body.length,
    }),
  );
}
