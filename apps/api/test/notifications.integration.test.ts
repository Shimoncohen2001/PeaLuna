import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
import { NotificationService } from '../src/modules/notifications/notification.service.js';
import type { MailMessage } from '../src/infrastructure/mailer.js';
import {
  createServiceType,
  createWig,
  deleteUsersByIds,
  ensureRoles,
  pingDatabase,
  prisma,
  registerVerifiedCustomer,
} from './helpers.js';

const hasDb = await pingDatabase();

describe.skipIf(!hasDb)('professional booking notifications', () => {
  const userIds: string[] = [];
  const inbox: MailMessage[] = [];
  const notifications = new NotificationService({
    mailer: { send: async (message) => { inbox.push(message); } },
    webOrigin: 'https://pealuna.com',
  });
  const technicians = new TechnicianService(notifications);
  let serviceId = '';
  let techUserId = '';
  let techProfileId = '';
  let otherTechUserId = '';

  beforeAll(async () => {
    await ensureRoles();
    const offered = await createServiceType('notify');
    serviceId = offered.id;
    const tech = await registerVerifiedCustomer('notify-tech');
    userIds.push(tech.userId);
    techUserId = tech.userId;
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Notify Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: true,
      serviceTypeIds: [serviceId],
    });
    await technicians.setAdminStatus(profile.id, 'APPROVED');
    techProfileId = profile.id;

    const other = await registerVerifiedCustomer('notify-other');
    userIds.push(other.userId);
    otherTechUserId = other.userId;
    const otherProfile = await technicians.apply(other.userId, {
      displayName: 'Other Expert',
      serviceCity: 'Haifa',
      servicePostalCode: '3100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: true,
      serviceTypeIds: [serviceId],
    });
    await technicians.setAdminStatus(otherProfile.id, 'APPROVED');
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    await prisma.serviceType.deleteMany({ where: { id: serviceId } });
  });

  it('creates an in-app request notice only for the assigned expert', async () => {
    const customer = await registerVerifiedCustomer('notify-cust');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const when = new Date(Date.now() + 220 * 60 * 60 * 1000);
    inbox.length = 0;

    const order = await technicians.createBooking({
      userId: customer.userId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: techProfileId,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: when.toISOString(),
        venueType: 'SALON',
      },
    });

    expect(order.status).toBe('WAITING_FOR_TECHNICIAN');

    const forTech = await prisma.notification.findMany({
      where: { userId: techUserId, channel: 'IN_APP', entityId: order.id },
    });
    const forCustomer = await prisma.notification.findMany({
      where: { userId: customer.userId },
    });

    expect(forCustomer).toHaveLength(0);
    expect(
      await prisma.notification.count({ where: { userId: otherTechUserId } }),
    ).toBe(0);
    expect(forTech).toHaveLength(1);
    expect(forTech[0]?.type).toBe('BOOKING_REQUEST');
    expect(forTech[0]?.readAt).toBeNull();
    expect(forTech[0]?.title).toMatch(/demande|request|בקשת/i);
    expect(forTech[0]?.body).toMatch(/pas encore confirmée|not confirmed|עדיין לא מאושרת/i);
    expect(JSON.stringify(forTech[0]?.payload)).toContain(`/pro/orders/${order.id}`);

    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.to).toBeDefined();
    expect(inbox[0]?.subject).toMatch(/demande|request|בקשת/i);
    expect(inbox[0]?.text).toContain(`https://pealuna.com/pro/orders/${order.id}`);

    await notifications.notifyBookingRequest({
      technicianUserId: techUserId,
      technicianEmail: inbox[0]!.to,
      technicianLocale: 'fr',
      technicianFirstName: 'Amina',
      orderId: order.id,
      orderNumber: order.orderNumber,
      scheduledAt: when,
      venueType: 'SALON',
      serviceNames: ['Test'],
      customerName: 'Test Customer',
    });
    expect(
      await prisma.notification.count({
        where: { userId: techUserId, channel: 'IN_APP', entityId: order.id },
      }),
    ).toBe(1);

    const unreadBefore = await notifications.unreadCount(techUserId);
    expect(unreadBefore).toBeGreaterThan(0);
    const marked = await notifications.markRead(techUserId, forTech[0]!.id);
    expect(marked.readAt).toBeTruthy();
    expect(await notifications.unreadCount(techUserId)).toBe(unreadBefore - 1);

    await expect(notifications.markRead(customer.userId, forTech[0]!.id)).rejects.toMatchObject({
      code: 'NOTIFICATION_NOT_FOUND',
    });

    const listed = await notifications.listForUser(techUserId, 1, 20);
    expect(listed.items.some((item) => item.id === forTech[0]!.id && item.href === `/pro/orders/${order.id}`)).toBe(
      true,
    );
  });

  it('keeps the in-app notice if email delivery fails, then retries mail without duplicating', async () => {
    const failing: MailMessage[] = [];
    let shouldFail = true;
    const flaky = new NotificationService({
      mailer: {
        send: async (message) => {
          if (shouldFail) throw new Error('smtp down');
          failing.push(message);
        },
      },
      webOrigin: 'https://pealuna.com',
    });
    const customer = await registerVerifiedCustomer('notify-mail-fail');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const when = new Date(Date.now() + 240 * 60 * 60 * 1000);
    const bookingTechs = new TechnicianService(flaky);

    const order = await bookingTechs.createBooking({
      userId: customer.userId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: techProfileId,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: when.toISOString(),
        venueType: 'SALON',
      },
    });

    expect(
      await prisma.notification.count({
        where: { userId: techUserId, channel: 'IN_APP', entityId: order.id },
      }),
    ).toBe(1);
    expect(
      await prisma.notification.findFirst({
        where: { userId: techUserId, channel: 'EMAIL', entityId: order.id },
      }),
    ).toMatchObject({ status: 'FAILED' });

    shouldFail = false;
    await flaky.notifyBookingRequest({
      technicianUserId: techUserId,
      technicianEmail: 'expert@pealuna.test',
      technicianLocale: 'fr',
      technicianFirstName: 'Amina',
      orderId: order.id,
      orderNumber: order.orderNumber,
      scheduledAt: when,
      venueType: 'SALON',
      serviceNames: ['Test'],
      customerName: 'Test Customer',
    });

    expect(
      await prisma.notification.count({
        where: { userId: techUserId, channel: 'IN_APP', entityId: order.id },
      }),
    ).toBe(1);
    expect(failing).toHaveLength(1);
    expect(
      await prisma.notification.findFirst({
        where: { userId: techUserId, channel: 'EMAIL', entityId: order.id },
      }),
    ).toMatchObject({ status: 'SENT' });
  });
});
