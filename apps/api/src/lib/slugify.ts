export function slugify(value: string, fallbackPrefix = 'item'): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return slug || `${fallbackPrefix}-${Date.now().toString(36)}`;
}
