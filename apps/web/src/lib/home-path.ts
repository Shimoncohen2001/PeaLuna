export function homePathForRoles(roles: string[] | undefined): string {
  if (roles?.includes('ADMIN') || roles?.includes('SUPER_ADMIN')) return '/admin';
  if (roles?.includes('TECHNICIAN')) return '/pro';
  return '/dashboard';
}
