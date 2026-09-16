import {
  calculatePlatformCommissionCents,
  canConfirmCashPayment,
  canMarkAppointmentComplete,
  resolveTransition,
  type Role,
} from '@velure/domain';
import { DEFAULT_CURRENCY, PLATFORM_COMMISSION_BPS, type CreateBookingInput } from '@velure/contracts';
import { prisma, type Prisma } from '@velure/database';
import {
  generateOrderNumber,
  requireApprovedTechnicianProfile,
  requireCustomerProfile,
  requireVerifiedUser,
  roundPublicCoord,
  toOrderActorRole,
} from '../../lib/access.js';
import { updateOrderIfVersion } from '../../lib/order-lock.js';

function mapPublicTechnician(
  t: Prisma.TechnicianProfileGetPayload<{
    include: {
      services: { include: { serviceType: true } };
      availability: true;
      user: { select: { firstName: true; lastName: true } };
    };
  }>,
  distanceKm?: number,
  privacy: 'public' | 'owner' = 'public',
) {
  const hideExactHome = privacy === 'public';
  return {
    id: t.id,
    displayName: t.displayName ?? `${t.user.firstName} ${t.user.lastName}`.trim(),
    headline: t.headline,
    bio: t.bio,
    yearsExperience: t.yearsExperience,
    serviceCity: t.serviceCity,
    servicePostalCode: hideExactHome ? null : t.servicePostalCode,
    serviceCountryCode: t.serviceCountryCode,
    salonAddress: hideExactHome && !t.offersSalonService ? null : t.salonAddress,
    offersHomeService: t.offersHomeService,
    offersSalonService: t.offersSalonService,
    acceptsCashPayment: t.acceptsCashPayment,
    latitude: hideExactHome ? roundPublicCoord(t.latitude) : t.latitude,
    longitude: hideExactHome ? roundPublicCoord(t.longitude) : t.longitude,
    ratingAvg: t.ratingAvg,
    reviewCount: t.reviewCount,
    distanceKm: distanceKm !== undefined ? Math.round(distanceKm * 10) / 10 : null,
    services: t.services.map((s) => ({
      id: s.serviceType.id,
      slug: s.serviceType.slug,
      name: s.serviceType.name,
      basePriceCents: s.customPriceCents ?? s.serviceType.basePriceCents,
      currency: s.serviceType.currency,
      category: s.serviceType.category,
    })),
    availability: t.availability
      .filter((a) => a.isActive)
      .map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
  };
}

export class TechnicianService {
  async apply(userId: string, input: {
    displayName: string;
    headline?: string;
    bio?: string;
    yearsExperience?: number;
    serviceCity: string;
    servicePostalCode: string;
    serviceCountryCode: string;
    salonAddress?: string;
    offersHomeService: boolean;
    offersSalonService: boolean;
    acceptsCashPayment?: boolean;
    serviceTypeIds: string[];
    latitude?: number;
    longitude?: number;
  }) {
    await requireVerifiedUser(userId);
    const existing = await prisma.technicianProfile.findUnique({ where: { userId } });

    const services = await prisma.serviceType.findMany({
      where: { id: { in: input.serviceTypeIds }, isActive: true },
    });
    if (services.length !== input.serviceTypeIds.length) {
      throw Object.assign(new Error('Invalid services'), { statusCode: 400, code: 'INVALID_SERVICES' });
    }

    const technicianRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TECHNICIAN' } });

    if (existing?.status === 'APPROVED') {
      throw Object.assign(new Error('You are already an approved expert'), {
        statusCode: 409,
        code: 'ALREADY_EXPERT',
      });
    }
    if (existing?.status === 'SUSPENDED') {
      throw Object.assign(new Error('This expert account is suspended'), {
        statusCode: 403,
        code: 'TECHNICIAN_SUSPENDED',
      });
    }
    if (existing && (existing.status === 'UNDER_REVIEW' || existing.status === 'PENDING_APPLICATION')) {
      throw Object.assign(new Error('Your application is already under review'), {
        statusCode: 409,
        code: 'APPLICATION_PENDING',
      });
    }

    const profileInclude = {
      services: { include: { serviceType: true } },
      availability: true,
      user: { select: { firstName: true, lastName: true } },
    } as const;

    const profile = await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId, roleId: technicianRole.id } });

      const applicationData = {
        displayName: input.displayName,
        headline: input.headline,
        bio: input.bio,
        yearsExperience: input.yearsExperience,
        serviceCity: input.serviceCity,
        servicePostalCode: input.servicePostalCode,
        serviceCountryCode: input.serviceCountryCode,
        salonAddress: input.salonAddress,
        offersHomeService: input.offersHomeService,
        offersSalonService: input.offersSalonService,
        acceptsCashPayment: input.acceptsCashPayment ?? false,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'UNDER_REVIEW' as const,
        approvedAt: null,
      };

      if (existing?.status === 'REJECTED') {
        await tx.technicianService.deleteMany({ where: { technicianId: existing.id } });
        return tx.technicianProfile.update({
          where: { id: existing.id },
          data: {
            ...applicationData,
            services: {
              create: input.serviceTypeIds.map((serviceTypeId) => ({ serviceTypeId })),
            },
          },
          include: profileInclude,
        });
      }

      return tx.technicianProfile.create({
        data: {
          userId,
          ...applicationData,
          services: {
            create: input.serviceTypeIds.map((serviceTypeId) => ({ serviceTypeId })),
          },
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
              { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
              { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
              { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
              { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
            ],
          },
        },
        include: profileInclude,
      });
    });

    return { ...mapPublicTechnician(profile, undefined, 'owner'), status: profile.status };
  }

  async getMine(userId: string) {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId },
      include: {
        services: { include: { serviceType: true } },
        availability: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!profile) {
      throw Object.assign(new Error('Technician profile not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }
    return { ...mapPublicTechnician(profile, undefined, 'owner'), status: profile.status };
  }

  async updateMine(
    userId: string,
    input: {
      displayName?: string;
      headline?: string;
      bio?: string;
      yearsExperience?: number;
      serviceCity?: string;
      servicePostalCode?: string;
      serviceCountryCode?: string;
      salonAddress?: string;
      offersHomeService?: boolean;
      offersSalonService?: boolean;
      acceptsCashPayment?: boolean;
      serviceTypeIds?: string[];
      latitude?: number;
      longitude?: number;
    },
  ) {
    const existing = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw Object.assign(new Error('Technician profile not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }
    if (existing.status === 'REJECTED' || existing.status === 'SUSPENDED') {
      throw Object.assign(new Error('Submit a new application to continue'), {
        statusCode: 409,
        code: 'REAPPLY_REQUIRED',
      });
    }

    if (input.serviceTypeIds) {
      const services = await prisma.serviceType.findMany({
        where: { id: { in: input.serviceTypeIds }, isActive: true },
      });
      if (services.length !== input.serviceTypeIds.length) {
        throw Object.assign(new Error('Invalid services'), {
          statusCode: 400,
          code: 'INVALID_SERVICES',
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.technicianProfile.update({
        where: { userId },
        data: {
          displayName: input.displayName,
          headline: input.headline,
          bio: input.bio,
          yearsExperience: input.yearsExperience,
          serviceCity: input.serviceCity,
          servicePostalCode: input.servicePostalCode,
          serviceCountryCode: input.serviceCountryCode,
          salonAddress: input.salonAddress,
          offersHomeService: input.offersHomeService,
          offersSalonService: input.offersSalonService,
          acceptsCashPayment: input.acceptsCashPayment,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });

      if (input.serviceTypeIds) {
        await tx.technicianService.deleteMany({ where: { technicianId: existing.id } });
        await tx.technicianService.createMany({
          data: input.serviceTypeIds.map((serviceTypeId) => ({
            technicianId: existing.id,
            serviceTypeId,
          })),
        });
      }
    });

    return this.getMine(userId);
  }

  async search(params: {
    postalCode?: string;
    city?: string;
    serviceTypeId?: string;
    venue?: 'HOME' | 'SALON';
    latitude?: number;
    longitude?: number;
    radiusKm: number;
    page: number;
    limit: number;
  }) {
    const where: Prisma.TechnicianProfileWhereInput = {
      status: 'APPROVED',
    };

    if (params.city) {
      where.serviceCity = { contains: params.city, mode: 'insensitive' };
    }
    if (params.venue === 'HOME') where.offersHomeService = true;
    if (params.venue === 'SALON') where.offersSalonService = true;
    if (params.serviceTypeId) {
      where.services = { some: { serviceTypeId: params.serviceTypeId } };
    }

    const rows = await prisma.technicianProfile.findMany({
      where,
      include: {
        services: { include: { serviceType: true } },
        availability: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const { haversineKm } = await import('../../lib/access.js');
    const hasUserGeo = params.latitude != null && params.longitude != null;
    const refLat = params.latitude;
    const refLng = params.longitude;

    const withDistance = rows.map((t) => {
      const distanceKm =
        hasUserGeo && refLat != null && refLng != null && t.latitude != null && t.longitude != null
          ? haversineKm(refLat, refLng, t.latitude, t.longitude)
          : Number.POSITIVE_INFINITY;
      return { t, distanceKm };
    });

    // Soft geo: prefer experts in radius, but never hide the whole list
    // (demo experts are in Israel — browser GPS elsewhere would otherwise empty results).
    const inRadius = hasUserGeo
      ? withDistance.filter((row) => row.distanceKm <= params.radiusKm)
      : withDistance;
    const nearby = inRadius.length > 0 ? inRadius : withDistance;

    nearby.sort((a, b) => {
      if (hasUserGeo && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      if (b.t.ratingAvg !== a.t.ratingAvg) return b.t.ratingAvg - a.t.ratingAvg;
      return b.t.reviewCount - a.t.reviewCount;
    });

    const total = nearby.length;
    const pageRows = nearby.slice((params.page - 1) * params.limit, params.page * params.limit);

    return {
      total,
      items: pageRows.map(({ t, distanceKm }) =>
        mapPublicTechnician(
          t,
          Number.isFinite(distanceKm) ? distanceKm : undefined,
        ),
      ),
    };
  }

  async getById(id: string) {
    const profile = await prisma.technicianProfile.findFirst({
      where: { id, status: 'APPROVED' },
      include: {
        services: { include: { serviceType: true } },
        availability: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!profile) {
      throw Object.assign(new Error('Technician not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }
    return mapPublicTechnician(profile);
  }

  async setAvailability(
    userId: string,
    slots: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[],
  ) {
    const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw Object.assign(new Error('Technician profile not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }

    await prisma.$transaction([
      prisma.technicianAvailability.deleteMany({ where: { technicianId: profile.id } }),
      prisma.technicianAvailability.createMany({
        data: slots.map((s) => ({
          technicianId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive,
        })),
      }),
    ]);

    return this.getMine(userId);
  }

  async dashboard(userId: string) {
    const profile = await requireApprovedTechnicianProfile(userId);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 13);

    const [totalAppointments, ongoing, completedAgg, upcoming, recentOrders] = await Promise.all([
      prisma.repairOrder.count({ where: { technicianId: profile.id } }),
      prisma.repairOrder.count({
        where: {
          technicianId: profile.id,
          status: {
            in: [
              'ACCEPTED',
              'PICKUP_SCHEDULED',
              'RECEIVED',
              'IN_DIAGNOSIS',
              'WAITING_CUSTOMER_APPROVAL',
              'IN_REPAIR',
              'QUALITY_CONTROL',
              'READY',
              'DELIVERY_SCHEDULED',
            ],
          },
        },
      }),
      prisma.repairOrder.aggregate({
        where: { technicianId: profile.id, status: 'COMPLETED' },
        _sum: { totalCents: true, platformFeeCents: true },
      }),
      prisma.repairOrder.findMany({
        where: {
          technicianId: profile.id,
          status: { notIn: ['CANCELLED', 'ARCHIVED', 'COMPLETED'] },
        },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        take: 10,
        include: {
          wig: { select: { name: true } },
          customer: { include: { user: { select: { firstName: true, lastName: true } } } },
          lineItems: true,
        },
      }),
      prisma.repairOrder.findMany({
        where: {
          technicianId: profile.id,
          createdAt: { gte: since },
          status: { not: 'CANCELLED' },
        },
        select: {
          createdAt: true,
          status: true,
          totalCents: true,
          platformFeeCents: true,
        },
      }),
    ]);

    const revenueCents =
      (completedAgg._sum.totalCents ?? 0) - (completedAgg._sum.platformFeeCents ?? 0);

    const dayKeys: string[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const bookingsByDay = Object.fromEntries(dayKeys.map((k) => [k, 0])) as Record<string, number>;
    const revenueByDay = Object.fromEntries(dayKeys.map((k) => [k, 0])) as Record<string, number>;

    for (const order of recentOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (Object.hasOwn(bookingsByDay, key)) {
        bookingsByDay[key] = (bookingsByDay[key] ?? 0) + 1;
      }
      if (order.status === 'COMPLETED' && Object.hasOwn(revenueByDay, key)) {
        revenueByDay[key] =
          (revenueByDay[key] ?? 0) + (order.totalCents - order.platformFeeCents);
      }
    }

    return {
      stats: {
        totalAppointments,
        ongoing,
        revenueCents,
        ratingAvg: profile.ratingAvg,
        reviewCount: profile.reviewCount,
      },
      series: {
        days: dayKeys.map((date) => ({
          date,
          bookings: bookingsByDay[date] ?? 0,
          revenueCents: revenueByDay[date] ?? 0,
        })),
      },
      upcoming: upcoming.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        scheduledAt: o.scheduledAt?.toISOString() ?? null,
        venueType: o.venueType,
        wigName: o.wig.name,
        customerName: `${o.customer.user.firstName} ${o.customer.user.lastName}`,
        services: o.lineItems.map((li) => li.description ?? 'Service'),
        totalCents: o.totalCents,
      })),
    };
  }

  async listAssignedOrders(userId: string, page: number, limit: number) {
    const profile = await requireApprovedTechnicianProfile(userId);

    const where = { technicianId: profile.id };
    const [total, orders] = await Promise.all([
      prisma.repairOrder.count({ where }),
      prisma.repairOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wig: { select: { name: true } },
          lineItems: true,
          customer: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
    ]);

    return {
      total,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        scheduledAt: o.scheduledAt?.toISOString() ?? null,
        venueType: o.venueType,
        wigName: o.wig.name,
        customerName: `${o.customer.user.firstName} ${o.customer.user.lastName}`,
        totalCents: o.totalCents,
        currency: o.currency,
        services: o.lineItems.map((li) => li.description ?? 'Service'),
      })),
    };
  }

  /**
   * Marketplace booking: select services + expert + slot → escrow-ready order.
   * Transitions: SUBMIT → ASSIGN → ACCEPT → SCHEDULE_PICKUP (appointment).
   */
  async createBooking(params: {
    userId: string;
    roles: Role[];
    homeRegion: string;
    input: CreateBookingInput;
  }) {
    await requireVerifiedUser(params.userId);
    const customer = await requireCustomerProfile(params.userId);
    const tech = await prisma.technicianProfile.findFirst({
      where: { id: params.input.technicianId, status: 'APPROVED' },
    });
    if (!tech) {
      throw Object.assign(new Error('Technician not available'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }
    if (tech.userId === params.userId) {
      throw Object.assign(new Error('You cannot book yourself'), {
        statusCode: 400,
        code: 'SELF_BOOKING',
      });
    }

    if (params.input.venueType === 'HOME' && !tech.offersHomeService) {
      throw Object.assign(new Error('Technician does not offer home service'), {
        statusCode: 400,
        code: 'VENUE_UNAVAILABLE',
      });
    }
    if (params.input.venueType === 'SALON' && !tech.offersSalonService) {
      throw Object.assign(new Error('Technician does not offer salon service'), {
        statusCode: 400,
        code: 'VENUE_UNAVAILABLE',
      });
    }

    if (params.input.venueType === 'HOME' && !params.input.serviceAddressLine?.trim()) {
      throw Object.assign(new Error('Home service requires an address'), {
        statusCode: 400,
        code: 'ADDRESS_REQUIRED',
      });
    }

    const services = await prisma.serviceType.findMany({
      where: { id: { in: params.input.serviceTypeIds }, isActive: true },
    });
    if (services.length !== params.input.serviceTypeIds.length) {
      throw Object.assign(new Error('Invalid services'), { statusCode: 400, code: 'INVALID_SERVICES' });
    }

    const offered = await prisma.technicianService.count({
      where: {
        technicianId: tech.id,
        serviceTypeId: { in: params.input.serviceTypeIds },
      },
    });
    if (offered !== params.input.serviceTypeIds.length) {
      throw Object.assign(new Error('Technician does not offer one or more selected services'), {
        statusCode: 400,
        code: 'SERVICE_NOT_OFFERED',
      });
    }

    const wigId = params.input.wigId;
    const wig = await prisma.wigProfile.findFirst({
      where: { id: wigId, customerId: customer.id, archivedAt: null },
    });
    if (!wig) {
      throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
    }

    const subtotalCents = services.reduce((sum, s) => sum + s.basePriceCents, 0);
    const platformFeeCents = calculatePlatformCommissionCents(subtotalCents);
    const scheduledAt = new Date(params.input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 60_000) {
      throw Object.assign(new Error('Scheduled time must be in the future'), {
        statusCode: 400,
        code: 'INVALID_SCHEDULE',
      });
    }

    const windowMs = 60 * 60 * 1000;
    const overlap = await prisma.repairOrder.findFirst({
      where: {
        technicianId: tech.id,
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - windowMs),
          lt: new Date(scheduledAt.getTime() + windowMs),
        },
      },
      select: { id: true },
    });
    if (overlap) {
      throw Object.assign(new Error('This time slot is no longer available'), {
        statusCode: 409,
        code: 'SLOT_UNAVAILABLE',
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      let created = await tx.repairOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          wigId,
          technicianId: tech.id,
          status: 'DRAFT',
          currency: DEFAULT_CURRENCY,
          subtotalCents,
          platformCommissionBps: PLATFORM_COMMISSION_BPS,
          platformFeeCents,
          totalCents: subtotalCents,
          customerNotes: params.input.customerNotes,
          fulfillmentRegion: params.homeRegion,
          venueType: params.input.venueType,
          scheduledAt,
          serviceAddressLine: params.input.serviceAddressLine,
          serviceCity: params.input.serviceCity ?? tech.serviceCity,
          servicePostalCode: params.input.servicePostalCode ?? tech.servicePostalCode,
          serviceLatitude: params.input.serviceLatitude,
          serviceLongitude: params.input.serviceLongitude,
          lineItems: {
            create: services.map((s) => ({
              serviceTypeId: s.id,
              description: s.name,
              quantity: 1,
              unitPriceCents: s.basePriceCents,
              totalCents: s.basePriceCents,
            })),
          },
        },
      });

      const steps: Array<'SUBMIT' | 'ASSIGN_TECHNICIAN'> = ['SUBMIT', 'ASSIGN_TECHNICIAN'];

      // Role per step for state machine — leave WAITING_FOR_TECHNICIAN for pro accept/decline
      const roleFor: Record<string, Role[]> = {
        SUBMIT: ['CUSTOMER'],
        ASSIGN_TECHNICIAN: ['ADMIN'],
      };

      for (const action of steps) {
        const actorRoles = roleFor[action] as Role[];
        const actorRole = toOrderActorRole(actorRoles);
        const transition = resolveTransition(created.status as never, action, actorRole);
        created = await tx.repairOrder.update({
          where: { id: created.id },
          data: {
            status: transition.to,
            version: { increment: 1 },
            submittedAt: action === 'SUBMIT' ? new Date() : undefined,
            technicianId: tech.id,
            scheduledAt,
            venueType: params.input.venueType,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: created.id,
            fromStatus: transition.from,
            toStatus: transition.to,
            action,
            actorId: params.userId,
            actorRole,
            reason: action === 'ASSIGN_TECHNICIAN' ? 'Expert assigned — awaiting confirmation' : undefined,
          },
        });
      }

      return tx.repairOrder.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          lineItems: true,
          wig: { select: { id: true, name: true } },
          technician: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      });
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalCents: order.totalCents,
      platformFeeCents: order.platformFeeCents,
      currency: order.currency,
      scheduledAt: order.scheduledAt?.toISOString() ?? null,
      venueType: order.venueType,
      wigName: order.wig.name,
      technicianName:
        order.technician?.displayName ??
        `${order.technician?.user.firstName ?? ''} ${order.technician?.user.lastName ?? ''}`.trim(),
      escrowNote:
        'En attente de confirmation de l’experte. Ensuite paiement escrow (fonds bloqués jusqu’à validation).',
      lineItems: order.lineItems.map((li) => ({
        serviceName: li.description ?? 'Service',
        lineTotalCents: li.totalCents,
      })),
    };
  }

  async respondToAssignment(params: {
    userId: string;
    orderId: string;
    decision: 'ACCEPT' | 'DECLINE';
  }) {
    const profile = await requireApprovedTechnicianProfile(params.userId);

    const order = await prisma.repairOrder.findFirst({
      where: {
        id: params.orderId,
        technicianId: profile.id,
        status: 'WAITING_FOR_TECHNICIAN',
      },
    });
    if (!order) {
      throw Object.assign(new Error('Assignment not found'), {
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let current = order;

      const apply = async (action: 'ACCEPT' | 'DECLINE' | 'SCHEDULE_PICKUP') => {
        const transition = resolveTransition(current.status as never, action, 'TECHNICIAN');
        await updateOrderIfVersion(tx, current.id, current.version, {
          status: transition.to,
        });
        if (action === 'DECLINE') {
          await tx.repairOrder.update({
            where: { id: current.id },
            data: { technicianId: null },
          });
        }
        current = await tx.repairOrder.findUniqueOrThrow({ where: { id: current.id } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: current.id,
            fromStatus: transition.from,
            toStatus: transition.to,
            action,
            actorId: params.userId,
            actorRole: 'TECHNICIAN',
            reason: action === 'DECLINE' ? 'Declined by technician' : 'Accepted by technician',
          },
        });
      };

      await apply(params.decision);

      if (params.decision === 'ACCEPT' && current.scheduledAt) {
        await apply('SCHEDULE_PICKUP');
      }

      return current;
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      scheduledAt: updated.scheduledAt?.toISOString() ?? null,
    };
  }

  async getAssignedOrder(userId: string, orderId: string) {
    const profile = await requireApprovedTechnicianProfile(userId);

    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, technicianId: profile.id },
      include: {
        wig: true,
        lineItems: true,
        customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }

    const careReport = await prisma.careReport.findUnique({
      where: { orderId: order.id },
      select: { status: true },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      version: order.version,
      currency: order.currency,
      totalCents: order.totalCents,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      cashConfirmedAt: order.cashConfirmedAt?.toISOString() ?? null,
      canConfirmCash: canConfirmCashPayment(order.status, order.paymentStatus),
      venueType: order.venueType,
      scheduledAt: order.scheduledAt?.toISOString() ?? null,
      serviceAddressLine: order.serviceAddressLine,
      serviceCity: order.serviceCity,
      servicePostalCode: order.servicePostalCode,
      serviceLatitude: order.serviceLatitude,
      serviceLongitude: order.serviceLongitude,
      customerNotes: order.customerNotes,
      canComplete: canMarkAppointmentComplete(order.status),
      canRespond: order.status === 'WAITING_FOR_TECHNICIAN',
      wig: {
        id: order.wig.id,
        name: order.wig.name,
        brand: order.wig.brand,
        color: order.wig.color,
        fiberType: order.wig.fiberType,
        conditionNotes: order.wig.conditionNotes,
        reference: order.wig.reference,
      },
      careReportStatus: careReport?.status ?? null,
      customer: {
        name: `${order.customer.user.firstName} ${order.customer.user.lastName}`.trim(),
        email: order.customer.user.email,
        phone: order.customer.phone,
      },
      services: order.lineItems.map((li) => ({
        id: li.id,
        name: li.description ?? 'Service',
        lineTotalCents: li.totalCents,
      })),
    };
  }

  async completeAssignedOrder(userId: string, orderId: string) {
    const profile = await requireApprovedTechnicianProfile(userId);

    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, technicianId: profile.id },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (!canMarkAppointmentComplete(order.status)) {
      throw Object.assign(new Error('This appointment cannot be marked complete yet'), {
        statusCode: 409,
        code: 'INVALID_STATUS',
      });
    }

    const submitted = await prisma.careReport.findUnique({
      where: { orderId },
    });
    if (!submitted || submitted.status !== 'SUBMITTED') {
      throw Object.assign(new Error('A completed care report is required before closing this job'), {
        statusCode: 409,
        code: 'CARE_REPORT_REQUIRED',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const transition = resolveTransition(order.status as never, 'COMPLETE', 'TECHNICIAN');
      await updateOrderIfVersion(tx, order.id, order.version, {
        status: transition.to,
        completedAt: new Date(),
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: transition.from,
          toStatus: transition.to,
          action: 'COMPLETE',
          actorId: userId,
          actorRole: 'TECHNICIAN',
          reason: 'Service marked complete by technician',
        },
      });
      return tx.repairOrder.findUniqueOrThrow({ where: { id: order.id } });
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString() ?? null,
    };
  }

  async listForAdmin(params: {
    status?: 'PENDING_APPLICATION' | 'UNDER_REVIEW' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
    page: number;
    limit: number;
  }) {
    const where = params.status ? { status: params.status } : {};
    const [total, rows] = await Promise.all([
      prisma.technicianProfile.count({ where }),
      prisma.technicianProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          services: { include: { serviceType: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        displayName: row.displayName ?? `${row.user.firstName} ${row.user.lastName}`.trim(),
        email: row.user.email,
        headline: row.headline,
        bio: row.bio,
        salonAddress: row.salonAddress,
        serviceCity: row.serviceCity,
        servicePostalCode: row.servicePostalCode,
        offersHomeService: row.offersHomeService,
        offersSalonService: row.offersSalonService,
        yearsExperience: row.yearsExperience,
        ratingAvg: row.ratingAvg,
        reviewCount: row.reviewCount,
        approvedAt: row.approvedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        services: row.services.map((s) => s.serviceType.name),
      })),
    };
  }

  async setAdminStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
    const existing = await prisma.technicianProfile.findUnique({ where: { id } });
    if (!existing) {
      throw Object.assign(new Error('Technician not found'), {
        statusCode: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      });
    }

    const technicianRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TECHNICIAN' } });

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.technicianProfile.update({
        where: { id },
        data: {
          status,
          approvedAt: status === 'APPROVED' ? new Date() : existing.approvedAt,
        },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          services: { include: { serviceType: { select: { name: true } } } },
        },
      });

      if (status === 'APPROVED') {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: existing.userId, roleId: technicianRole.id } },
          create: { userId: existing.userId, roleId: technicianRole.id },
          update: {},
        });
      } else {
        await tx.userRole.deleteMany({
          where: { userId: existing.userId, roleId: technicianRole.id },
        });
      }

      return row;
    });

    return {
      id: updated.id,
      status: updated.status,
      displayName: updated.displayName ?? `${updated.user.firstName} ${updated.user.lastName}`.trim(),
      email: updated.user.email,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    };
  }
}
