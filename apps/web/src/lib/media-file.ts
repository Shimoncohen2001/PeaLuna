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

export async function fileToBase64(file: File): Promise<{ bytes: number; contentBase64: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = buffer.byteLength;
  if (bytes <= 0) {
    throw new Error('Empty file');
  }
  const raw = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < raw.length; i += chunk) {
    binary += String.fromCharCode(...raw.subarray(i, i + chunk));
  }
  return { bytes, contentBase64: btoa(binary) };
}
