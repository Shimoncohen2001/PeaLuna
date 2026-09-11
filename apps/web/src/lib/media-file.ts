/** iPhone camera often sends empty type, image/jpg, or HEIF. */
export function normalizeMediaMime(file: File): string {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
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
