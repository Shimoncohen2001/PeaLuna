import type { Role } from '@velure/domain';
import type { OrderActorRole } from '@velure/domain';
import { prisma } from '@velure/database';
import type { FastifyRequest } from 'fastify';

export function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw Object.assign(new Error('Unauthenticated'), { statusCode: 401, code: 'UNAUTHENTICATED' });
  }
  return request.user;
}

export function requireAdmin(request: FastifyRequest) {
  const user = requireUser(request);
  const roles = user.roles as Role[];
  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    throw Object.assign(new Error('Admin access required'), {
      statusCode: 403,
      code: 'ADMIN_REQUIRED',
    });
  }
  return user;
}

export async function requireVerifiedUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('Unauthenticated'), { statusCode: 401, code: 'UNAUTHENTICATED' });
  }
  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    throw Object.assign(new Error('Account is not active'), {
      statusCode: 403,
      code: 'ACCOUNT_INACTIVE',
    });
  }

  const mustVerify =
    (process.env.NODE_ENV === 'production' && process.env.PREVIEW_MODE !== 'true') ||
    process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
  if (mustVerify && !user.emailVerifiedAt) {
    throw Object.assign(new Error('Email verification required'), {
      statusCode: 403,
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  return user;
}

export async function requireCustomerProfile(userId: string) {
  const profile = await prisma.customerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw Object.assign(new Error('Customer profile required'), {
      statusCode: 403,
      code: 'CUSTOMER_REQUIRED',
    });
  }
  return profile;
}

export async function requireTechnicianProfile(userId: string) {
  const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw Object.assign(new Error('Technician profile required'), {
      statusCode: 403,
      code: 'TECHNICIAN_REQUIRED',
    });
  }
  return profile;
}

/** Operational technician APIs (jobs, Stripe, care) require an approved profile. */
export async function requireApprovedTechnicianProfile(userId: string) {
  const profile = await requireTechnicianProfile(userId);
  if (profile.status !== 'APPROVED') {
    throw Object.assign(new Error('Technician application is not approved'), {
      statusCode: 403,
      code: 'TECHNICIAN_NOT_APPROVED',
    });
  }
  return profile;
}

export type OrderActorSurface = 'customer' | 'technician';

/**
 * Actor role for the order FSM. Customer routes never inherit TECHNICIAN
 * from a dual-role JWT (a customer who also applied as expert must not
 * COMPLETE their own orders).
 */
export function toOrderActorRole(roles: Role[], surface: OrderActorSurface = 'customer'): OrderActorRole {
  if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('OPS')) return 'OPS';
  if (surface === 'technician') return 'TECHNICIAN';
  return 'CUSTOMER';
}

export function generateWigReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(Math.random() * 0xfff)
    .toString(16)
    .toUpperCase()
    .padStart(3, '0');
  return `WG-${stamp}${rand}`;
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `PL-${stamp}-${rand}`;
}

/** Approximate distance in km (Haversine). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
