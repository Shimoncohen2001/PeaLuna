import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
import {
  createServiceType,
  deleteUsersByIds,
  ensureRoles,
  pingDatabase,
  prisma,
  registerVerifiedCustomer,
} from './helpers.js';

const hasDb = await pingDatabase();

describe.skipIf(!hasDb)('technician application approval', () => {
  const userIds: string[] = [];
  const technicians = new TechnicianService();
  let serviceId = '';

  beforeAll(async () => {
    await ensureRoles();
    const service = await createServiceType('apply');
    serviceId = service.id;
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    await prisma.serviceType.deleteMany({ where: { id: serviceId } });
  });

  function applyBody(displayName: string) {
    return {
      displayName,
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: false,
      serviceTypeIds: [serviceId],
      latitude: 32.0853,
      longitude: 34.7818,
    };
  }

  it('keeps new applications under review without granting TECHNICIAN', async () => {
    const applicant = await registerVerifiedCustomer('apply-new');
    userIds.push(applicant.userId);

    const profile = await technicians.apply(applicant.userId, applyBody('Pending Expert'));
    expect(profile.status).toBe('UNDER_REVIEW');

    const role = await prisma.userRole.findFirst({
      where: { userId: applicant.userId, role: { name: 'TECHNICIAN' } },
    });
    expect(role).toBeNull();

    const listed = await technicians.search({
      radiusKm: 80,
      page: 1,
      limit: 50,
    });
    expect(listed.items.find((row) => row.id === profile.id)).toBeUndefined();
  });

  it('rejects a second apply while review is pending', async () => {
    const applicant = await registerVerifiedCustomer('apply-dup');
    userIds.push(applicant.userId);
    await technicians.apply(applicant.userId, applyBody('Dup Expert'));

    await expect(technicians.apply(applicant.userId, applyBody('Dup Expert'))).rejects.toMatchObject({
      code: 'APPLICATION_PENDING',
    });
  });

  it('lets a rejected expert resubmit, then grants TECHNICIAN only after approve', async () => {
    const applicant = await registerVerifiedCustomer('apply-rej');
    userIds.push(applicant.userId);
    const first = await technicians.apply(applicant.userId, applyBody('Rejected Expert'));
    await technicians.setAdminStatus(first.id, 'REJECTED');

    await expect(technicians.updateMine(applicant.userId, { headline: 'nope' })).rejects.toMatchObject({
      code: 'REAPPLY_REQUIRED',
    });

    const resubmitted = await technicians.apply(applicant.userId, {
      ...applyBody('Rejected Expert'),
      headline: 'Lace specialist',
    });
    expect(resubmitted.id).toBe(first.id);
    expect(resubmitted.status).toBe('UNDER_REVIEW');
    expect(resubmitted.headline).toBe('Lace specialist');

    const approved = await technicians.setAdminStatus(resubmitted.id, 'APPROVED');
    expect(approved.status).toBe('APPROVED');

    const role = await prisma.userRole.findFirst({
      where: { userId: applicant.userId, role: { name: 'TECHNICIAN' } },
    });
    expect(role).toBeTruthy();

    const publicCard = await technicians.getById(resubmitted.id);
    expect(publicCard.servicePostalCode).toBeNull();
    expect(publicCard.latitude).toBe(32.09);
    expect(publicCard.longitude).toBe(34.78);
  });

  it('blocks re-apply after approval', async () => {
    const applicant = await registerVerifiedCustomer('apply-ok');
    userIds.push(applicant.userId);
    const profile = await technicians.apply(applicant.userId, applyBody('Approved Expert'));
    await technicians.setAdminStatus(profile.id, 'APPROVED');

    await expect(technicians.apply(applicant.userId, applyBody('Approved Expert'))).rejects.toMatchObject({
      code: 'ALREADY_EXPERT',
    });
  });
});
