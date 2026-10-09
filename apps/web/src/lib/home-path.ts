export function homePathForRoles(roles: string[] | undefined): string {
  if (roles?.includes('ADMIN') || roles?.includes('SUPER_ADMIN')) return '/admin';
  if (roles?.includes('TECHNICIAN')) return '/pro';
  return '/dashboard';
}

export function postAuthPath(
  user: { roles?: string[]; emailVerified?: boolean } | null | undefined,
  next?: string | null,
): string {
  if (user && user.emailVerified === false) return '/verify-email';
  if (next?.startsWith('/') && !next.startsWith('//') && next !== '/verify-email') {
    return next;
  }
  return homePathForRoles(user?.roles);
}
