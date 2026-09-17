import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { TechnicianService } from '../src/modules/technicians/technician.service.js';
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

describe.skipIf(!hasDb)('admin catalog', () => {
  const catalog = new CatalogService();
  const technicians = new TechnicianService();
  const userIds: string[] = [];
  const skillIds: string[] = [];
  const stepIds: string[] = [];
  let serviceId = '';

  beforeAll(async () => {
    await ensureRoles();
    const service = await createServiceType('catalog');
    serviceId = service.id;
  });

  afterAll(async () => {
    await deleteUsersByIds(userIds);
    if (stepIds.length) await prisma.workflowStep.deleteMany({ where: { id: { in: stepIds } } });
    if (skillIds.length) await prisma.skill.deleteMany({ where: { id: { in: skillIds } } });
    if (serviceId) await prisma.serviceType.deleteMany({ where: { id: serviceId } });
  });

  it('creates skills that a technician can select', async () => {
    const skill = await catalog.createSkill({
      name: 'Lace specialist',
      description: 'Lace repair',
      sortOrder: 1,
      isActive: true,
    });
    skillIds.push(skill.id);

    const tech = await registerVerifiedCustomer('catskill');
    userIds.push(tech.userId);
    const profile = await technicians.apply(tech.userId, {
      displayName: 'Skill Expert',
      serviceCity: 'Tel Aviv',
      servicePostalCode: '6100000',
      serviceCountryCode: 'IL',
      offersHomeService: true,
      offersSalonService: true,
      serviceTypeIds: [serviceId],
      skillIds: [skill.id],
      latitude: 32.0853,
      longitude: 34.7818,
    });

    expect(profile.skills.map((s) => s.id)).toContain(skill.id);

    await catalog.deleteSkill(skill.id);
    const hidden = await catalog.listSkills(true);
    expect(hidden.find((s) => s.id === skill.id)?.isActive).toBe(false);
  });

  it('blocks finishing a job until required workflow steps are completed', async () => {
    const step = await catalog.createWorkflowStep({
      title: 'Confirm work done',
      description: 'Tick when finished',
      sortOrder: 1,
      isRequired: true,
      isActive: true,
      inputKind: 'CHECK',
    });
    stepIds.push(step.id);

    const tech = await registerVerifiedCustomer('catsteptech');
    const customer = await registerVerifiedCustomer('catstepcust');
    userIds.push(tech.userId, customer.userId);

    try {
      const profile = await technicians.apply(tech.userId, {
        displayName: 'Step Expert',
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
      const wig = await createWig(customer.userId);
      const booking = await technicians.createBooking({
        userId: customer.userId,
        roles: ['CUSTOMER'],
        homeRegion: 'eu-central-1',
        input: {
          technicianId: profile.id,
          wigId: wig.id,
          serviceTypeIds: [serviceId],
          scheduledAt: new Date(Date.now() + 240 * 60 * 60 * 1000).toISOString(),
          venueType: 'SALON',
        },
      });
      await technicians.respondToAssignment({
        userId: tech.userId,
        orderId: booking.id,
        decision: 'ACCEPT',
      });

      const incomplete = await catalog.listIncompleteRequired(booking.id);
      expect(incomplete.map((s) => s.id)).toContain(step.id);

      await expect(catalog.assertRequiredComplete(booking.id)).rejects.toMatchObject({
        code: 'WORKFLOW_INCOMPLETE',
      });

      await catalog.saveOrderWorkflow(booking.id, {
        steps: [{ stepId: step.id, completed: true, note: null }],
      });
      await expect(catalog.assertRequiredComplete(booking.id)).resolves.toBeUndefined();
    } finally {
      await prisma.orderWorkflowProgress.deleteMany({ where: { stepId: step.id } });
      await prisma.workflowStep.delete({ where: { id: step.id } }).catch(() => undefined);
    }
  });
});
