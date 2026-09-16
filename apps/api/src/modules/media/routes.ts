import { randomUUID } from 'node:crypto';
import {
  confirmUploadSchema,
  createUploadUrlSchema,
  directUploadSchema,
  errorResponse,
  successResponse,
} from '@velure/contracts';
import { prisma } from '@velure/database';
import type { Role } from '@velure/domain';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { createS3Client, headObject, putObject, signedPutUrl } from './s3.js';
import {
  assertPreviewStorageKey,
  ensureMediaRoot,
  isDiskMediaEnabled,
  isDurableDiskMedia,
  previewFileExists,
  previewPublicUrl,
  readPreviewFile,
  writePreviewFile,
} from './preview-store.js';

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    case 'image/heif':
      return 'heic';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/quicktime':
      return 'mov';
    default:
      return 'jpg';
  }
}

async function assertWigMediaAccess(params: {
  userId: string;
  roles: Role[];
  wigId: string;
  orderId?: string;
  careReportId?: string;
}) {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: params.userId } });
  if (customer) {
    const wig = await prisma.wigProfile.findFirst({
      where: { id: params.wigId, customerId: customer.id, archivedAt: null },
    });
    if (wig) {
      if (params.orderId) {
        const order = await prisma.repairOrder.findFirst({
          where: { id: params.orderId, customerId: customer.id, wigId: params.wigId },
        });
        if (!order) {
          throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
        }
      }
      return wig;
    }
  }

  if (params.roles.includes('TECHNICIAN')) {
    const tech = await prisma.technicianProfile.findUnique({ where: { userId: params.userId } });
    if (!tech || tech.status !== 'APPROVED') {
      throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
    }
    const order = await prisma.repairOrder.findFirst({
      where: {
        wigId: params.wigId,
        technicianId: tech.id,
        ...(params.orderId ? { id: params.orderId } : {}),
        status: { not: 'CANCELLED' },
      },
    });
    if (!order) {
      throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
    }
    if (params.careReportId) {
      const report = await prisma.careReport.findFirst({
        where: { id: params.careReportId, orderId: order.id, technicianId: tech.id, status: 'DRAFT' },
      });
      if (!report) {
        throw Object.assign(new Error('Care report not found'), {
          statusCode: 404,
          code: 'CARE_REPORT_NOT_FOUND',
        });
      }
    }
    return prisma.wigProfile.findFirstOrThrow({ where: { id: params.wigId } });
  }

  throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
}

export async function mediaRoutes(app: AppInstance, env: Env): Promise<void> {
  const s3 = createS3Client(env);
  const diskEnabled = isDiskMediaEnabled(env, Boolean(s3));

  if (diskEnabled) {
    try {
      const dir = await ensureMediaRoot(env);
      app.log.info(
        { dir, durable: isDurableDiskMedia(env) },
        isDurableDiskMedia(env)
          ? 'Media stored on the mounted volume'
          : 'Media stored in a temp dir, files are lost on restart',
      );
    } catch (err) {
      app.log.error({ err, mediaDir: env.MEDIA_DIR }, 'Media directory is not writable');
    }
  }

  const asBuffer = (_req: unknown, body: Buffer, done: (err: null, data: Buffer) => void) => {
    done(null, body);
  };
  for (const mime of [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/octet-stream',
  ]) {
    try {
      app.addContentTypeParser(mime, { parseAs: 'buffer' }, asBuffer);
    } catch {
      // Parser already registered on this Fastify instance.
    }
  }

  app.post(
    `${API_PREFIX}/media/upload-url`,
    {
      preHandler: [app.authenticate],
      schema: { body: createUploadUrlSchema },
    },
    async (request, reply) => {
      if ((!s3 || !env.S3_BUCKET) && !diskEnabled) {
        return reply
          .status(503)
          .send(
            errorResponse('STORAGE_UNAVAILABLE', 'Media storage is not configured', request.requestId),
          );
      }

      const user = requireUser(request);
      const body = request.body;
      const wig = await assertWigMediaAccess({
        userId: user.sub,
        roles: user.roles as Role[],
        wigId: body.wigId,
        orderId: body.orderId,
        careReportId: body.careReportId,
      });

      const ext = extensionForMime(body.mimeType);
      const storageKey = `wigs/${wig.id}/${randomUUID()}.${ext}`;

      const uploadUrl =
        s3 && env.S3_BUCKET
          ? await signedPutUrl(s3, env.S3_BUCKET, storageKey, body.mimeType, body.fileSizeBytes)
          : previewPublicUrl(env.WEB_ORIGIN, storageKey).replace(
              '/media/preview-file/',
              '/media/preview-put/',
            );

      return reply.send(
        successResponse(
          {
            uploadUrl,
            storageKey,
            expiresIn: 600,
            bucket: env.S3_BUCKET ?? 'preview',
          },
          request.requestId,
        ),
      );
    },
  );

  app.post(
    `${API_PREFIX}/media/direct`,
    {
      preHandler: [app.authenticate],
      schema: { body: directUploadSchema },
    },
    async (request, reply) => {
      try {
        const user = requireUser(request);
        const body = request.body;
        const wig = await assertWigMediaAccess({
          userId: user.sub,
          roles: user.roles as Role[],
          wigId: body.wigId,
          orderId: body.orderId,
          careReportId: body.careReportId,
        });

        const bytes = Buffer.from(body.contentBase64, 'base64');
        if (bytes.length === 0) {
          throw Object.assign(new Error('Uploaded object is empty'), {
            statusCode: 400,
            code: 'EMPTY_OBJECT',
          });
        }

        const ext = extensionForMime(body.mimeType);
        const storageKey = `wigs/${wig.id}/${randomUUID()}.${ext}`;

        if (s3 && env.S3_BUCKET) {
          await putObject(s3, env.S3_BUCKET, storageKey, bytes, body.mimeType);
        } else if (diskEnabled) {
          await writePreviewFile(env, storageKey, bytes);
        } else {
          throw Object.assign(new Error('Media storage is not configured'), {
            statusCode: 503,
            code: 'STORAGE_UNAVAILABLE',
          });
        }

        const attachment = await prisma.wigAttachment.create({
          data: {
            wigId: body.wigId,
            orderId: body.orderId,
            careReportId: body.careReportId,
            storageKey,
            mimeType: body.mimeType,
            fileSizeBytes: bytes.length,
            purpose: body.purpose,
            photoPhase: body.photoPhase,
            photoAngle: body.photoAngle,
            uploadedById: user.sub,
          },
        });

        return reply.status(201).send(
          successResponse(
            {
              id: attachment.id,
              storageKey: attachment.storageKey,
              mimeType: attachment.mimeType,
              fileSizeBytes: attachment.fileSizeBytes,
              purpose: attachment.purpose,
              photoPhase: attachment.photoPhase,
              photoAngle: attachment.photoAngle,
              createdAt: attachment.createdAt.toISOString(),
            },
            request.requestId,
          ),
        );
      } catch (err) {
        const extra = err as { statusCode?: number; code?: string; message?: string };
        if (extra.statusCode && extra.statusCode < 500) throw err;
        request.log.error({ err }, 'Direct media upload failed');
        const code = extra.code ?? 'UPLOAD_FAILED';
        // Replying here keeps the storage-specific code, which the generic 500
        // handler would otherwise flatten into INTERNAL_ERROR.
        return reply
          .status(extra.statusCode && extra.statusCode >= 500 ? extra.statusCode : 500)
          .send(
            errorResponse(
              code,
              code === 'STORAGE_UNAVAILABLE'
                ? 'Media storage is not configured'
                : 'Photo upload failed',
              request.requestId,
            ),
          );
      }
    },
  );

  app.post(
    `${API_PREFIX}/media/confirm`,
    {
      preHandler: [app.authenticate],
      schema: { body: confirmUploadSchema },
    },
    async (request, reply) => {
      const user = requireUser(request);
      const body = request.body;

      if (!body.storageKey.startsWith(`wigs/${body.wigId}/`)) {
        throw Object.assign(new Error('Invalid storage key'), {
          statusCode: 400,
          code: 'INVALID_STORAGE_KEY',
        });
      }

      await assertWigMediaAccess({
        userId: user.sub,
        roles: user.roles as Role[],
        wigId: body.wigId,
        orderId: body.orderId,
        careReportId: body.careReportId,
      });

      if (s3 && env.S3_BUCKET) {
        try {
          const head = await headObject(s3, env.S3_BUCKET, body.storageKey);
          if (head.ContentLength != null && head.ContentLength <= 0) {
            throw Object.assign(new Error('Uploaded object is empty'), {
              statusCode: 400,
              code: 'EMPTY_OBJECT',
            });
          }
        } catch (err) {
          const extra = err as { statusCode?: number; code?: string; name?: string };
          if (extra.statusCode === 400 && extra.code === 'EMPTY_OBJECT') throw err;
          throw Object.assign(new Error('Upload was not found in storage'), {
            statusCode: 400,
            code: 'OBJECT_NOT_FOUND',
          });
        }
      } else if (diskEnabled) {
        const ok = await previewFileExists(env, body.storageKey);
        if (!ok) {
          throw Object.assign(new Error('Upload was not found in storage'), {
            statusCode: 400,
            code: 'OBJECT_NOT_FOUND',
          });
        }
      } else {
        throw Object.assign(new Error('Media storage is not configured'), {
          statusCode: 503,
          code: 'STORAGE_UNAVAILABLE',
        });
      }

      const attachment = await prisma.wigAttachment.create({
        data: {
          wigId: body.wigId,
          orderId: body.orderId,
          careReportId: body.careReportId,
          storageKey: body.storageKey,
          mimeType: body.mimeType,
          fileSizeBytes: body.fileSizeBytes,
          purpose: body.purpose,
          photoPhase: body.photoPhase,
          photoAngle: body.photoAngle,
          uploadedById: user.sub,
          aiAnalysisStatus: 'PENDING',
        },
      });

      return reply.status(201).send(
        successResponse(
          {
            id: attachment.id,
            storageKey: attachment.storageKey,
            mimeType: attachment.mimeType,
            fileSizeBytes: attachment.fileSizeBytes,
            purpose: attachment.purpose,
            photoPhase: attachment.photoPhase,
            photoAngle: attachment.photoAngle,
            createdAt: attachment.createdAt.toISOString(),
          },
          request.requestId,
        ),
      );
    },
  );

  app.put(`${API_PREFIX}/media/preview-put/:key`, async (request, reply) => {
    if (!diskEnabled) {
      throw Object.assign(new Error('Media storage is not configured'), {
        statusCode: 503,
        code: 'STORAGE_UNAVAILABLE',
      });
    }
    const key = decodeURIComponent((request.params as { key: string }).key);
    assertPreviewStorageKey(key);
    const payload = request.body;
    if (!Buffer.isBuffer(payload) || payload.length === 0) {
      throw Object.assign(new Error('Uploaded object is empty'), {
        statusCode: 400,
        code: 'EMPTY_OBJECT',
      });
    }
    await writePreviewFile(env, key, payload);
    return reply.status(204).send();
  });

  app.get(`${API_PREFIX}/media/preview-file/:key`, async (request, reply) => {
    if (!diskEnabled) {
      throw Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    const key = decodeURIComponent((request.params as { key: string }).key);
    try {
      const data = await readPreviewFile(env, key);
      const ext = key.split('.').pop()?.toLowerCase();
      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'heic'
              ? 'image/heic'
              : ext === 'mp4'
                ? 'video/mp4'
                : ext === 'webm'
                  ? 'video/webm'
                  : ext === 'mov'
                    ? 'video/quicktime'
                    : 'image/jpeg';
      return reply.header('Cache-Control', 'private, max-age=3600').type(mime).send(data);
    } catch {
      throw Object.assign(new Error('Not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
  });
}
