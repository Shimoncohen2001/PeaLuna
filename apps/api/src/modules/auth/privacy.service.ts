import { prisma } from '@velure/database';

export class PrivacyService {
  async exportForUser(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: { include: { role: { select: { name: true } } } },
        customerProfile: {
          include: {
            wigs: {
              select: {
                id: true,
                reference: true,
                name: true,
                brand: true,
                createdAt: true,
                archivedAt: true,
              },
            },
            orders: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                paymentStatus: true,
                totalCents: true,
                currency: true,
                scheduledAt: true,
                createdAt: true,
              },
            },
          },
        },
        technicianProfile: {
          select: {
            id: true,
            status: true,
            displayName: true,
            serviceCity: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        countryCode: user.countryCode,
        locale: user.locale,
        timezone: user.timezone,
        roles: user.roles.map((r) => r.role.name),
        createdAt: user.createdAt,
      },
      wigs: user.customerProfile?.wigs ?? [],
      orders: user.customerProfile?.orders ?? [],
      technician: user.technicianProfile,
    };
  }

  async deleteAccount(userId: string) {
    const tombstone = `deleted.${userId}@invalid.pealuna.local`;
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.emailVerificationToken.updateMany({
        where: { userId, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          email: tombstone,
          firstName: 'Deleted',
          lastName: 'User',
          passwordHash: 'deleted',
          status: 'DELETED',
          emailVerifiedAt: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'account.delete',
          entityType: 'user',
          entityId: userId,
        },
      }),
    ]);
    return { deleted: true as const };
  }
}
