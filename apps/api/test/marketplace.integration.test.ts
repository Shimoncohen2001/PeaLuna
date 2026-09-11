import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { InvalidStateTransitionError } from '@velure/domain';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
import { OrderService } from '../src/modules/orders/order.service.js';
import { PaymentService } from '../src/modules/payments/payment.service.js';
import {
  createServiceType,
  createWig,
  deleteUsersByIds,
  ensureRoles,
  pingDatabase,
  prisma,
  registerVerifiedCustomer,
  testEnv,
} from './helpers.js';

const hasDb = await pingDatabase();

describe.skipIf(!hasDb)('marketplace integration', () => {
  const userIds: string[] = [];
  const technicians = new TechnicianService();
  const payments = new PaymentService(testEnv());
  const orders = new OrderService(payments);
  let serviceId = '';
  let extraServiceId = '';
  let techUserId = '';
  let techProfileId = '';

  beforeAll(async () => {
    await ensureRoles();
    const offered = await createServiceType('offered');
    const extra = await createServiceType('extra');
    serviceId = offered.id;
    extraServiceId = extra.id;

    const tech = await registerVerifiedCustomer('tech');
    userIds.push(tech.userId);
    techUserId = tech.userId;
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Test Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: true,
      serviceTypeIds: [serviceId],
    });
    techProfileId = profile.id;
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    await prisma.serviceType.deleteMany({ where: { id: { in: [serviceId, extraServiceId] } } });
  });

  async function book(customerUserId: string, scheduledAt: Date, extra?: Record<string, unknown>) {
    const wig = await createWig(customerUserId);
    return technicians.createBooking({
      userId: customerUserId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: techProfileId,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: scheduledAt.toISOString(),
        venueType: 'SALON',
        ...extra,
      },
    });
  }

  it('rejects home booking without an address', async () => {
    const customer = await registerVerifiedCustomer('home');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const when = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await expect(
      technicians.createBooking({
        userId: customer.userId,
        roles: ['CUSTOMER'],
        homeRegion: 'eu-central-1',
        input: {
          technicianId: techProfileId,
          wigId: wig.id,
          serviceTypeIds: [serviceId],
          scheduledAt: when.toISOString(),
          venueType: 'HOME',
        },
      }),
    ).rejects.toMatchObject({ code: 'ADDRESS_REQUIRED' });
  });

  it('rejects a service the expert does not offer', async () => {
    const customer = await registerVerifiedCustomer('svc');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const when = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await expect(
      technicians.createBooking({
        userId: customer.userId,
        roles: ['CUSTOMER'],
        homeRegion: 'eu-central-1',
        input: {
          technicianId: techProfileId,
          wigId: wig.id,
          serviceTypeIds: [extraServiceId],
          scheduledAt: when.toISOString(),
          venueType: 'SALON',
        },
      }),
    ).rejects.toMatchObject({ code: 'SERVICE_NOT_OFFERED' });
  });

  it('rejects overlapping slots and self-booking', async () => {
    const customer = await registerVerifiedCustomer('slot');
    userIds.push(customer.userId);
    const when = new Date(Date.now() + 96 * 60 * 60 * 1000);
    await book(customer.userId, when);

    await expect(book(customer.userId, new Date(when.getTime() + 30 * 60 * 1000))).rejects.toMatchObject(
      { code: 'SLOT_UNAVAILABLE' },
    );

    const techWig = await createWig(techUserId);
    await expect(
      technicians.createBooking({
        userId: techUserId,
        roles: ['CUSTOMER', 'TECHNICIAN'],
        homeRegion: 'eu-central-1',
        input: {
          technicianId: techProfileId,
          wigId: techWig.id,
          serviceTypeIds: [serviceId],
          scheduledAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
          venueType: 'SALON',
        },
      }),
    ).rejects.toMatchObject({ code: 'SELF_BOOKING' });
  });

  it('blocks COMPLETE on customer routes even with a TECHNICIAN JWT role', async () => {
    const customer = await registerVerifiedCustomer('dual');
    userIds.push(customer.userId);
    const technicianRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TECHNICIAN' } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: customer.userId, roleId: technicianRole.id } },
      create: { userId: customer.userId, roleId: technicianRole.id },
      update: {},
    });

    const when = new Date(Date.now() + 144 * 60 * 60 * 1000);
    const booking = await book(customer.userId, when);
    await technicians.respondToAssignment({
      userId: techUserId,
      orderId: booking.id,
      decision: 'ACCEPT',
    });

    await expect(
      orders.applyAction({
        orderId: booking.id,
        userId: customer.userId,
        roles: ['CUSTOMER', 'TECHNICIAN'],
        action: 'COMPLETE',
      }),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it('holds escrow until the job is completed and captures only once', async () => {
    const customer = await registerVerifiedCustomer('escrow');
    userIds.push(customer.userId);
    const when = new Date(Date.now() + 168 * 60 * 60 * 1000);
    const booking = await book(customer.userId, when);
    await technicians.respondToAssignment({
      userId: techUserId,
      orderId: booking.id,
      decision: 'ACCEPT',
    });

    await payments.simulateAuthorize(booking.id, customer.userId);

    await expect(payments.releaseEscrow(booking.id, customer.userId)).rejects.toMatchObject({
      code: 'RELEASE_NOT_ALLOWED',
    });

    const order = await prisma.repairOrder.findUniqueOrThrow({ where: { id: booking.id } });
    await prisma.careReport.create({
      data: {
        wigId: order.wigId,
        orderId: order.id,
        technicianId: order.technicianId!,
        technicianDisplayName: 'Test Expert',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
    await technicians.completeAssignedOrder(techUserId, booking.id);

    const [first, second] = await Promise.all([
      payments.releaseEscrow(booking.id, customer.userId),
      payments.releaseEscrow(booking.id, customer.userId),
    ]);

    expect(first.paymentStatus).toBe('CAPTURED');
    expect(second.paymentStatus).toBe('CAPTURED');

    const commissions = await prisma.platformCommission.count({ where: { orderId: booking.id } });
    expect(commissions).toBe(1);

    const captured = await prisma.repairOrder.findUniqueOrThrow({ where: { id: booking.id } });
    expect(captured.paymentStatus).toBe('CAPTURED');
  });

  it('blocks booking when email verification is required', async () => {
    const previous = process.env.REQUIRE_EMAIL_VERIFICATION;
    process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
    try {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      const auth = new AuthService(testEnv());
      const session = await auth.register({
        email: `pending.${crypto.randomUUID()}@pealuna.test`,
        password: 'TestPassw0rd12',
        firstName: 'Pend',
        lastName: 'Ing',
        countryCode: 'IL',
      });
      userIds.push(session.user.id);
      const wig = await createWig(session.user.id);
      await expect(
        technicians.createBooking({
          userId: session.user.id,
          roles: ['CUSTOMER'],
          homeRegion: 'eu-central-1',
          input: {
            technicianId: techProfileId,
            wigId: wig.id,
            serviceTypeIds: [serviceId],
            scheduledAt: new Date(Date.now() + 192 * 60 * 60 * 1000).toISOString(),
            venueType: 'SALON',
          },
        }),
      ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    } finally {
      if (previous === undefined) delete process.env.REQUIRE_EMAIL_VERIFICATION;
      else process.env.REQUIRE_EMAIL_VERIFICATION = previous;
    }
  });
});
