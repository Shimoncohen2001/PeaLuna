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

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(file);
  }
}

const MAX_EDGE = 1600;
const MAX_JPEG_BYTES = 1_500_000;
const MAX_FALLBACK_BYTES = 8 * 1024 * 1024;

/** Shrink iPhone photos to a JPEG the API can accept. */
export async function prepareMediaForUpload(file: File): Promise<File> {
  if (file.size <= 0) {
    throw new Error('This photo is empty. Try the gallery instead.');
  }

  const mime = normalizeMediaMime(file);
  if (mime.startsWith('video/')) {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Video is too large. Please send a photo.');
    }
    return file;
  }

  try {
    const bitmap = await decodeImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let blob: Blob | null = null;
    for (const quality of [0.82, 0.7, 0.55, 0.4]) {
      const next = await canvasToJpeg(canvas, quality);
      if (!next || next.size === 0) continue;
      blob = next;
      if (next.size <= MAX_JPEG_BYTES) break;
    }
    if (!blob) {
      throw new Error('Could not process this photo. Try another one.');
    }
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Could not')) throw err;
    if (file.size > MAX_FALLBACK_BYTES) {
      throw new Error('This photo is too large. Choose a smaller picture.');
    }
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
