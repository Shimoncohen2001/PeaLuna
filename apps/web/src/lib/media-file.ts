/** iPhone camera often sends empty type, image/jpg, Live Photo HEIF, or HEIC. */
export function normalizeMediaMime(file: File): string {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/jpg' || mime === 'image/pjpeg') return 'image/jpeg';
  if (mime === 'image/heic-sequence') return 'image/heic';
  if (mime === 'image/heif-sequence') return 'image/heif';
  if (mime) return mime;

  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.heic')) return 'image/heic';
  if (name.endsWith('.heif')) return 'image/heif';
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  if (name.endsWith('.mov')) return 'video/quicktime';
  return 'image/jpeg';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(blob);
  });
}

/** Shrink iPhone photos to a JPEG the API can accept. */
export async function prepareMediaForUpload(file: File): Promise<File> {
  const mime = normalizeMediaMime(file);
  if (mime.startsWith('video/')) {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Video is too large. Please send a photo.');
    }
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8),
    );
    if (!blob || blob.size === 0) return file;
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function fileToBase64(file: File): Promise<{ bytes: number; contentBase64: string }> {
  const contentBase64 = await blobToBase64(file);
  if (!contentBase64) {
    throw new Error('Empty file');
  }
  const bytes = Math.ceil((contentBase64.length * 3) / 4);
  if (bytes <= 0) {
    throw new Error('Empty file');
  }
  return { bytes, contentBase64 };
}
