export const Role = {
  CUSTOMER: 'CUSTOMER',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN',
  OPS: 'OPS',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Permission = {
  ORDERS_READ_OWN: 'orders:read:own',
  ORDERS_READ_ASSIGNED: 'orders:read:assigned',
  ORDERS_UPDATE_OWN: 'orders:update:own',
  ORDERS_UPDATE_ASSIGNED: 'orders:update:assigned',
  ORDERS_READ_ALL: 'orders:read:all',
  ORDERS_MANAGE: 'orders:manage',
  TECHNICIANS_READ: 'technicians:read',
  TECHNICIANS_APPROVE: 'technicians:approve',
  USERS_MANAGE: 'users:manage',
  ANALYTICS_READ: 'analytics:read',
  COMMISSION_MANAGE: 'commission:manage',
  CATALOG_MANAGE: 'catalog:manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.CUSTOMER]: [Permission.ORDERS_READ_OWN, Permission.ORDERS_UPDATE_OWN],
  [Role.TECHNICIAN]: [
    Permission.ORDERS_READ_ASSIGNED,
    Permission.ORDERS_UPDATE_ASSIGNED,
    Permission.TECHNICIANS_READ,
  ],
  [Role.OPS]: [
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_MANAGE,
    Permission.TECHNICIANS_READ,
    Permission.ANALYTICS_READ,
  ],
  [Role.ADMIN]: [
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_MANAGE,
    Permission.TECHNICIANS_READ,
    Permission.TECHNICIANS_APPROVE,
    Permission.USERS_MANAGE,
    Permission.ANALYTICS_READ,
    Permission.COMMISSION_MANAGE,
    Permission.CATALOG_MANAGE,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function rolesHavePermission(roles: Role[], permission: Permission): boolean {
  return roles.some((r) => roleHasPermission(r, permission));
}
