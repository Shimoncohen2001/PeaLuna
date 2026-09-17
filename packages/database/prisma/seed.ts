import { PrismaClient, TechnicianStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ROLES = ['CUSTOMER', 'TECHNICIAN', 'OPS', 'ADMIN', 'SUPER_ADMIN'] as const;

const PERMISSIONS = [
  'orders:read:own',
  'orders:read:assigned',
  'orders:update:own',
  'orders:update:assigned',
  'orders:read:all',
  'orders:manage',
  'technicians:read',
  'technicians:approve',
  'users:manage',
  'analytics:read',
  'commission:manage',
  'catalog:manage',
] as const;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  CUSTOMER: ['orders:read:own', 'orders:update:own'],
  TECHNICIAN: ['orders:read:assigned', 'orders:update:assigned', 'technicians:read'],
  OPS: ['orders:read:all', 'orders:manage', 'technicians:read', 'analytics:read'],
  ADMIN: [
    'orders:read:all',
    'orders:manage',
    'technicians:read',
    'technicians:approve',
    'users:manage',
    'analytics:read',
    'commission:manage',
    'catalog:manage',
  ],
  SUPER_ADMIN: [...PERMISSIONS],
};

/** Catalogue Israel (ILS, agorot) */
const SERVICE_CATALOG = [
  {
    slug: 'comble-trou',
    name: 'תיקון חור',
    description: 'תיקון חורים ואזורים פגומים בלייס או בבסיס',
    category: 'תיקון',
    basePriceCents: 18_000,
    estimatedDays: 1,
    estimatedMinutes: 45,
    sortOrder: 1,
  },
  {
    slug: 'couper-lace',
    name: 'חיתוך לייס',
    description: 'חיתוך מקצועי של הלייס למראה טבעי',
    category: 'תיקון',
    basePriceCents: 12_000,
    estimatedDays: 1,
    estimatedMinutes: 30,
    sortOrder: 2,
  },
  {
    slug: 'baby-hair',
    name: 'בייבי הייר',
    description: 'יצירה ועיצוב בייבי הייר',
    category: 'עיצוב',
    basePriceCents: 15_000,
    estimatedDays: 1,
    estimatedMinutes: 40,
    sortOrder: 3,
  },
  {
    slug: 'lavage-brushing-soin',
    name: 'שטיפה / בראשינג / טיפול',
    description: 'שטיפה, טיפול לחות ובראשינג מקצועי',
    category: 'טיפול',
    basePriceCents: 22_000,
    estimatedDays: 1,
    estimatedMinutes: 90,
    sortOrder: 4,
  },
  {
    slug: 'couleur',
    name: 'צבע',
    description: 'צביעה, באליאז׳ או תיקון צבע',
    category: 'צבע',
    basePriceCents: 32_000,
    estimatedDays: 1,
    estimatedMinutes: 120,
    sortOrder: 5,
  },
  {
    slug: 'transformation-lace',
    name: 'המרה לפאה לייס',
    description: 'המרה מלאה של פאה קלאסית ללייס',
    category: 'המרה',
    basePriceCents: 65_000,
    estimatedDays: 3,
    estimatedMinutes: 180,
    sortOrder: 6,
  },
];

const SKILL_CATALOG = [
  { slug: 'lavage', name: 'Lavage', sortOrder: 1 },
  { slug: 'soin-profond', name: 'Soin profond', sortOrder: 2 },
  { slug: 'demelage', name: 'Démêlage', sortOrder: 3 },
  { slug: 'sechage', name: 'Séchage', sortOrder: 4 },
  { slug: 'brushing', name: 'Brushing', sortOrder: 5 },
  { slug: 'coiffage', name: 'Coiffage', sortOrder: 6 },
  { slug: 'coupe', name: 'Coupe', sortOrder: 7 },
  { slug: 'coloration', name: 'Coloration', sortOrder: 8 },
  { slug: 'decoloration', name: 'Décoloration', sortOrder: 9 },
  { slug: 'patine', name: 'Patine', sortOrder: 10 },
  { slug: 'reparation-lace', name: 'Réparation lace', sortOrder: 11 },
  { slug: 'remplacement-lace', name: 'Remplacement lace', sortOrder: 12 },
  { slug: 'reparation-de-la-base', name: 'Réparation de la base', sortOrder: 13 },
  { slug: 'ajout-de-cheveux', name: 'Ajout de cheveux', sortOrder: 14 },
  { slug: 'remplacement-de-cheveux', name: 'Remplacement de cheveux', sortOrder: 15 },
  { slug: 'reconstruction', name: 'Reconstruction', sortOrder: 16 },
  { slug: 'transformation', name: 'Transformation', sortOrder: 17 },
  { slug: 'baby-hair-style', name: 'Baby hair', sortOrder: 18 },
  { slug: 'reparation-des-noeuds', name: 'Réparation des nœuds', sortOrder: 19 },
  { slug: 'autre', name: 'Autre', sortOrder: 20 },
];

const WORKFLOW_STEP_CATALOG = [
  {
    slug: 'confirm-start',
    title: 'אישור תחילת הטיפול',
    description: 'אשר שהפאה בידך ושהטיפול יכול להתחיל.',
    sortOrder: 1,
    isRequired: false,
    inputKind: 'CHECK' as const,
  },
  {
    slug: 'document-work',
    title: 'תיעוד העבודה שבוצעה',
    description: 'מלא את פירוט העבודה בגיליון הטיפול.',
    sortOrder: 2,
    isRequired: false,
    inputKind: 'CHECK' as const,
  },
  {
    slug: 'confirm-ready',
    title: 'אישור שהשירות מוכן',
    description: 'אשר שהפאה מוכנה להחזרה ללקוחה.',
    sortOrder: 3,
    isRequired: false,
    inputKind: 'CHECK' as const,
  },
];

async function hashDemoPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name, description: name },
      update: {},
    });
  }

  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      create: { name, description: `${name} role` },
      update: {},
    });

    const permNames = ROLE_PERMISSION_MAP[name] ?? [];
    for (const permName of permNames) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { name: permName },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  for (const service of SERVICE_CATALOG) {
    await prisma.serviceType.upsert({
      where: { slug: service.slug },
      create: { ...service, currency: 'ILS', isActive: true },
      update: {},
    });
  }

  // Deactivate old EN catalog entries if present
  await prisma.serviceType.updateMany({
    where: {
      slug: { in: ['repair-lace-front', 'deep-conditioning', 'transformation-style'] },
    },
    data: { isActive: false },
  });

  await prisma.skill.updateMany({
    where: {
      slug: { in: ['lace-repair', 'baby-hair', 'color', 'wash-treatment', 'lace-conversion'] },
    },
    data: { isActive: false, sortOrder: 1000 },
  });

  for (const skill of SKILL_CATALOG) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      create: skill,
      update: {},
    });
  }

  for (const step of WORKFLOW_STEP_CATALOG) {
    await prisma.workflowStep.upsert({
      where: { slug: step.slug },
      create: step,
      update: {},
    });
  }

  const allowDemo =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_SEED === 'true';

  if (!allowDemo) {
    console.log('Seed completed: catalog and roles only (demo accounts skipped in production).');
    return;
  }

  const services = await prisma.serviceType.findMany({
    where: { isActive: true },
  });
  const technicianRole = await prisma.role.findUniqueOrThrow({ where: { name: 'TECHNICIAN' } });
  const passwordHash = await hashDemoPassword('DemoExpert123');

  const demos = [
    {
      email: 'amina@pealuna.demo',
      firstName: 'Noa',
      lastName: 'K.',
      displayName: 'Noa K.',
      headline: 'מומחית לייס ובייבי הייר',
      city: 'Tel Aviv',
      postalCode: '6100000',
      lat: 32.0853,
      lng: 34.7818,
      ratingAvg: 4.9,
      reviewCount: 128,
      yearsExperience: 6,
    },
    {
      email: 'sara@pealuna.demo',
      firstName: 'Yael',
      lastName: 'M.',
      displayName: 'Yael M.',
      headline: 'צבע והמרות',
      city: 'Jerusalem',
      postalCode: '9100000',
      lat: 31.7683,
      lng: 35.2137,
      ratingAvg: 4.8,
      reviewCount: 86,
      yearsExperience: 4,
    },
    {
      email: 'lea@pealuna.demo',
      firstName: 'Michal',
      lastName: 'D.',
      displayName: 'Michal D.',
      headline: 'טיפול ובראשינג עד הבית',
      city: 'Haifa',
      postalCode: '3100000',
      lat: 32.794,
      lng: 34.9896,
      ratingAvg: 5,
      reviewCount: 54,
      yearsExperience: 5,
    },
  ];

  for (const demo of demos) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        passwordHash,
        firstName: demo.firstName,
        lastName: demo.lastName,
        countryCode: 'IL',
        locale: 'he-IL',
        timezone: 'Asia/Jerusalem',
        homeRegion: 'eu-central-1',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: technicianRole.id } },
        technicianProfile: {
          create: {
            status: TechnicianStatus.APPROVED,
            displayName: demo.displayName,
            headline: demo.headline,
            bio: `${demo.headline} — טיפול בפאות בישראל.`,
            yearsExperience: demo.yearsExperience,
            serviceCity: demo.city,
            servicePostalCode: demo.postalCode,
            serviceCountryCode: 'IL',
            offersHomeService: true,
            offersSalonService: true,
            salonAddress: `${demo.postalCode} ${demo.city}`,
            latitude: demo.lat,
            longitude: demo.lng,
            ratingAvg: demo.ratingAvg,
            reviewCount: demo.reviewCount,
            approvedAt: new Date(),
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
                { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
                { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
                { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
                { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
                { dayOfWeek: 6, startTime: '11:00', endTime: '16:00' },
              ],
            },
          },
        },
      },
      update: {
        passwordHash,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
      include: { technicianProfile: true },
    });

    // Ensure TECHNICIAN role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: technicianRole.id },
      },
      create: { userId: user.id, roleId: technicianRole.id },
      update: {},
    });

    let profile = user.technicianProfile;
    if (!profile) {
      profile = await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          status: TechnicianStatus.APPROVED,
          displayName: demo.displayName,
          headline: demo.headline,
          serviceCity: demo.city,
          servicePostalCode: demo.postalCode,
          serviceCountryCode: 'IL',
          latitude: demo.lat,
          longitude: demo.lng,
          ratingAvg: demo.ratingAvg,
          reviewCount: demo.reviewCount,
          yearsExperience: demo.yearsExperience,
          approvedAt: new Date(),
          offersHomeService: true,
          offersSalonService: true,
        },
      });
    } else {
      profile = await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: {
          status: TechnicianStatus.APPROVED,
          displayName: demo.displayName,
          headline: demo.headline,
          serviceCity: demo.city,
          servicePostalCode: demo.postalCode,
          serviceCountryCode: 'IL',
          latitude: demo.lat,
          longitude: demo.lng,
          ratingAvg: demo.ratingAvg,
          reviewCount: demo.reviewCount,
          yearsExperience: demo.yearsExperience,
          approvedAt: new Date(),
          offersHomeService: true,
          offersSalonService: true,
        },
      });
    }

    for (const service of services) {
      await prisma.technicianService.upsert({
        where: {
          technicianId_serviceTypeId: {
            technicianId: profile.id,
            serviceTypeId: service.id,
          },
        },
        create: {
          technicianId: profile.id,
          serviceTypeId: service.id,
        },
        update: {},
      });
    }

    const skills = await prisma.skill.findMany({ where: { isActive: true } });
    for (const skill of skills) {
      await prisma.technicianSkill.upsert({
        where: {
          technicianId_skillId: {
            technicianId: profile.id,
            skillId: skill.id,
          },
        },
        create: {
          technicianId: profile.id,
          skillId: skill.id,
        },
        update: {},
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'CUSTOMER' } });
  const adminHash = await hashDemoPassword('DemoAdmin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pealuna.demo' },
    create: {
      email: 'admin@pealuna.demo',
      passwordHash: adminHash,
      firstName: 'Maya',
      lastName: 'Admin',
      countryCode: 'IL',
      locale: 'he-IL',
      timezone: 'Asia/Jerusalem',
      status: 'ACTIVE',
      roles: {
        create: [{ roleId: adminRole.id }, { roleId: customerRole.id }],
      },
      customerProfile: { create: {} },
    },
    update: {
      passwordHash: adminHash,
      status: 'ACTIVE',
      countryCode: 'IL',
      locale: 'he-IL',
      timezone: 'Asia/Jerusalem',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    create: { userId: admin.id, roleId: adminRole.id },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: customerRole.id } },
    create: { userId: admin.id, roleId: customerRole.id },
    update: {},
  });
  await prisma.customerProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id },
    update: {},
  });

  console.log(
    'Seed completed: Israel catalog, demo experts (DemoExpert123), admin@pealuna.demo / DemoAdmin123',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
