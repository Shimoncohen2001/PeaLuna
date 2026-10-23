import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
import { ReviewService } from '../src/modules/reviews/review.service.js';
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

describe.skipIf(!hasDb)('public expert reviews', () => {
  const userIds: string[] = [];
  const technicians = new TechnicianService();
  const reviews = new ReviewService();
  let serviceId = '';
  let techProfileId = '';

  beforeAll(async () => {
    await ensureRoles();
    const service = await createServiceType('revpub');
    serviceId = service.id;

    const tech = await registerVerifiedCustomer('rev-tech');
    userIds.push(tech.userId);
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Review Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: true,
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

  async function leaveReview(comment: string | null, rating = 5) {
    const customer = await registerVerifiedCustomer('rev-c');
    userIds.push(customer.userId);
    await prisma.user.update({
      where: { id: customer.userId },
      data: { firstName: 'Noa', lastName: 'Levi' },
    });
    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customer.userId },
    });
    const wig = await createWig(customer.userId);
    const order = await prisma.repairOrder.create({
      data: {
        orderNumber: `PL-RV${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        customerId: customerProfile.id,
        wigId: wig.id,
        technicianId: techProfileId,
        status: 'COMPLETED',
        paymentStatus: 'CAPTURED',
      },
    });
    await prisma.review.create({
      data: { orderId: order.id, rating, comment },
    });
    await prisma.technicianProfile.update({
      where: { id: techProfileId },
      data: { ratingAvg: rating, reviewCount: { increment: 1 } },
    });
  }

  it('lists comments for an approved expert without last names', async () => {
    await leaveReview('The lace work was very clean.');

    const listed = await reviews.listPublicForTechnician(techProfileId, 1, 10);
    expect(listed.total).toBeGreaterThan(0);
    expect(listed.reviews[0]?.customerName).toBe('Noa L.');
    expect(listed.reviews[0]?.comment).toBe('The lace work was very clean.');
    expect(listed.reviews[0]).not.toHaveProperty('orderId');
  });

  it('attaches a preview quote on the public expert list', async () => {
    const result = await technicians.search({ radiusKm: 80, page: 1, limit: 50 });
    const card = result.items.find((row) => row.id === techProfileId);
    expect(card?.previewReview?.comment).toBeTruthy();
    expect(card?.previewReview?.customerName).toBe('Noa L.');
  });

  it('does not list reviews for an unknown expert', async () => {
    await expect(
      reviews.listPublicForTechnician('00000000-0000-4000-8000-000000000000', 1, 10),
    ).rejects.toMatchObject({ code: 'TECHNICIAN_NOT_FOUND' });
  });
});
