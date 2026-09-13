import { fileToBase64, normalizeMediaMime, prepareMediaForUpload } from '@/lib/media-file';

type UploadMeta = {
  wigId: string;
  orderId?: string;
  careReportId?: string;
  purpose: 'INTAKE' | 'PROGRESS' | 'QC' | 'DELIVERY' | 'BEFORE_CARE' | 'AFTER_CARE' | 'OTHER';
  photoPhase?: 'BEFORE' | 'AFTER';
  photoAngle?: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'LACE' | 'EXTRA';
};

export async function uploadWigMedia(
  file: File,
  meta: UploadMeta,
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>,
) {
  const prepared = await prepareMediaForUpload(file);
  const mimeType = normalizeMediaMime(prepared);
  const { bytes, contentBase64 } = await fileToBase64(prepared);
  return authFetch<{
    id: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
  }>('/api/v1/media/direct', {
    method: 'POST',
    body: JSON.stringify({
      wigId: meta.wigId,
      orderId: meta.orderId,
      careReportId: meta.careReportId,
      mimeType,
      fileSizeBytes: bytes,
      purpose: meta.purpose,
      photoPhase: meta.photoPhase,
      photoAngle: meta.photoAngle,
      filename: file.name || 'iphone.jpg',
      contentBase64,
    }),
  });
}
