import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PaymentService } from '../src/modules/payments/payment.service.js';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
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

describe.skipIf(!hasDb)('cash payments', () => {
  const userIds: string[] = [];
  const technicians = new TechnicianService();
  const payments = new PaymentService(testEnv());
  let serviceId = '';
  let techUserId = '';
  let techProfileId = '';
  let slotHour = 0;

  beforeAll(async () => {
    await ensureRoles();
    const offered = await createServiceType('cash');
    serviceId = offered.id;

    const tech = await registerVerifiedCustomer('cashtech');
    userIds.push(tech.userId);
    techUserId = tech.userId;
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Cash Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: false,
      offersSalonService: true,
      acceptsCashPayment: true,
      serviceTypeIds: [serviceId],
      latitude: 32.0853,
      longitude: 34.7818,
    });
    await technicians.setAdminStatus(profile.id, 'APPROVED');
    techProfileId = profile.id;
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    await prisma.serviceType.deleteMany({ where: { id: serviceId } });
  });

  async function acceptedBooking(prefix: string) {
    const customer = await registerVerifiedCustomer(prefix);
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    slotHour += 24;
    const booking = await technicians.createBooking({
      userId: customer.userId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: techProfileId,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: new Date(Date.now() + slotHour * 60 * 60 * 1000).toISOString(),
        venueType: 'SALON',
      },
    });
    await technicians.respondToAssignment({
      userId: techUserId,
      orderId: booking.id,
      decision: 'ACCEPT',
    });
    return { customer, booking };
  }

  /** The expert can only close the balance after the job is marked complete. */
  async function completeJob(orderId: string) {
    const order = await prisma.repairOrder.findUniqueOrThrow({ where: { id: orderId } });
    await prisma.careReport.create({
      data: {
        wigId: order.wigId,
        orderId: order.id,
        technicianId: order.technicianId!,
        technicianDisplayName: 'Cash Expert',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
    await technicians.completeAssignedOrder(techUserId, orderId);
  }

  it('closes the order and records the commission the expert owes', async () => {
    const { customer, booking } = await acceptedBooking('cashclient');

    const chosen = await payments.chooseCashPayment(booking.id, customer.userId);
    expect(chosen.paymentStatus).toBe('CASH_PENDING');

    await expect(
      payments.confirmCashReceived(booking.id, techUserId),
    ).rejects.toMatchObject({ code: 'CASH_CONFIRM_NOT_ALLOWED' });

    await completeJob(booking.id);

    const confirmed = await payments.confirmCashReceived(booking.id, techUserId);
    expect(confirmed.paymentStatus).toBe('CAPTURED');
    expect(confirmed.commissionDueCents).toBe(Math.round(booking.totalCents * 0.2));

    const order = await prisma.repairOrder.findUniqueOrThrow({ where: { id: booking.id } });
    expect(order.paymentMethod).toBe('CASH');
    expect(order.cashConfirmedAt).not.toBeNull();

    const commission = await prisma.platformCommission.findUniqueOrThrow({
      where: { orderId: booking.id },
    });
    expect(commission.dueFromTechnician).toBe(true);
    expect(commission.settledAt).toBeNull();

    // Confirming twice must stay idempotent and never duplicate the commission.
    const again = await payments.confirmCashReceived(booking.id, techUserId);
    expect(again.paymentStatus).toBe('CAPTURED');
    expect(await prisma.platformCommission.count({ where: { orderId: booking.id } })).toBe(1);

    const due = await payments.listCashCommissions(false);
    expect(due.some((row) => row.orderNumber === order.orderNumber)).toBe(true);

    await payments.settleCashCommission(commission.id);
    const settled = await prisma.platformCommission.findUniqueOrThrow({
      where: { id: commission.id },
    });
    expect(settled.settledAt).not.toBeNull();
    await expect(payments.settleCashCommission(commission.id)).rejects.toMatchObject({
      code: 'COMMISSION_NOT_DUE',
    });
  });

  it('refuses cash when the expert does not accept it', async () => {
    const solo = await registerVerifiedCustomer('nocashtech');
    userIds.push(solo.userId);
    const profile = await technicians.apply(solo.userId, {
      displayName: 'Card Only Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: false,
      offersSalonService: true,
      serviceTypeIds: [serviceId],
      latitude: 32.0853,
      longitude: 34.7818,
    });
    await technicians.setAdminStatus(profile.id, 'APPROVED');

    const customer = await registerVerifiedCustomer('nocashclient');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const booking = await technicians.createBooking({
      userId: customer.userId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: profile.id,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: new Date(Date.now() + 500 * 60 * 60 * 1000).toISOString(),
        venueType: 'SALON',
      },
    });
    await technicians.respondToAssignment({
      userId: solo.userId,
      orderId: booking.id,
      decision: 'ACCEPT',
    });

    await expect(
      payments.chooseCashPayment(booking.id, customer.userId),
    ).rejects.toMatchObject({ code: 'CASH_NOT_ACCEPTED' });
  });

  it('lets the customer go back to card before handing any cash', async () => {
    const { customer, booking } = await acceptedBooking('switchclient');

    await payments.chooseCashPayment(booking.id, customer.userId);
    const reverted = await payments.cancelCashPayment(booking.id, customer.userId);
    expect(reverted.paymentStatus).toBe('UNPAID');
    expect(reverted.paymentMethod).toBe('CARD');

    const order = await prisma.repairOrder.findUniqueOrThrow({ where: { id: booking.id } });
    expect(order.paymentMethod).toBe('CARD');
  });

  it('blocks cash once the card escrow is engaged', async () => {
    const { customer, booking } = await acceptedBooking('escrowclient');
    await payments.simulateAuthorize(booking.id, customer.userId);

    await expect(
      payments.chooseCashPayment(booking.id, customer.userId),
    ).rejects.toMatchObject({ code: 'CARD_PAYMENT_ENGAGED' });
  });
});
