import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { CareReportService } from '../src/modules/care-reports/care-report.service.js';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
import { writePreviewFile } from '../src/modules/media/preview-store.js';
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

describe.skipIf(!hasDb)('care report photos', () => {
  const userIds: string[] = [];
  const technicians = new TechnicianService();
  const careReports = new CareReportService(testEnv());
  let serviceId = '';
  let techUserId = '';
  let techProfileId = '';

  beforeAll(async () => {
    await ensureRoles();
    const offered = await createServiceType('care');
    serviceId = offered.id;

    const tech = await registerVerifiedCustomer('caretech');
    userIds.push(tech.userId);
    techUserId = tech.userId;
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Care Expert',
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
    techProfileId = profile.id;
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    await prisma.serviceType.deleteMany({ where: { id: serviceId } });
  });

  it('returns a usable URL for before/after photos without object storage', async () => {
    const customer = await registerVerifiedCustomer('careclient');
    userIds.push(customer.userId);
    const wig = await createWig(customer.userId);
    const booking = await technicians.createBooking({
      userId: customer.userId,
      roles: ['CUSTOMER'],
      homeRegion: 'eu-central-1',
      input: {
        technicianId: techProfileId,
        wigId: wig.id,
        serviceTypeIds: [serviceId],
        scheduledAt: new Date(Date.now() + 240 * 60 * 60 * 1000).toISOString(),
        venueType: 'SALON',
      },
    });
    await technicians.respondToAssignment({
      userId: techUserId,
      orderId: booking.id,
      decision: 'ACCEPT',
    });

    const report = await prisma.careReport.create({
      data: {
        wigId: wig.id,
        orderId: booking.id,
        technicianId: techProfileId,
        technicianDisplayName: 'Care Expert',
      },
    });

    const key = `wigs/${wig.id}/${randomUUID()}.jpg`;
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await writePreviewFile(testEnv(), key, bytes);
    await prisma.wigAttachment.create({
      data: {
        wigId: wig.id,
        orderId: booking.id,
        careReportId: report.id,
        storageKey: key,
        mimeType: 'image/jpeg',
        fileSizeBytes: bytes.length,
        purpose: 'BEFORE_CARE',
        photoPhase: 'BEFORE',
        photoAngle: 'FRONT',
        uploadedById: techUserId,
      },
    });

    const draft = await careReports.getOrCreateDraft(techUserId, booking.id);

    expect(draft.photos).toHaveLength(1);
    expect(draft.photos[0]?.phase).toBe('BEFORE');
    expect(draft.photos[0]?.url).toContain('/api/v1/media/preview-file/');
    expect(draft.photos[0]?.url).toContain(encodeURIComponent(key));
  });
});
