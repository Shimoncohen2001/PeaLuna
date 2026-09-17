import { HAIR_ADD_CODES, type SaveCareReportInput } from '@velure/contracts';
import { canConfirmCashPayment, canMarkAppointmentComplete, resolveTransition } from '@velure/domain';
import { prisma, type CareOperationCode, type Prisma } from '@velure/database';
import type { Env } from '../../config/env.js';
import { requireApprovedTechnicianProfile } from '../../lib/access.js';
import { updateOrderIfVersion } from '../../lib/order-lock.js';
import { mediaPublicUrl } from '../media/media-url.js';
import { createS3Client } from '../media/s3.js';
import { CatalogService } from '../catalog/catalog.service.js';

const HAIR_CODES = new Set<string>(HAIR_ADD_CODES);

type ReportRow = Prisma.CareReportGetPayload<{
  include: {
    operations: true;
    photos: true;
    wig: true;
    order: true;
  };
}>;

export class CareReportService {
  constructor(private readonly env: Env) {}

  async getOrCreateDraft(userId: string, orderId: string) {
    const ctx = await this.requireAssignedOrder(userId, orderId);
    if (!canMarkAppointmentComplete(ctx.order.status) && ctx.order.status !== 'COMPLETED') {
      const existing = await prisma.careReport.findUnique({
        where: { orderId },
        include: { operations: true, photos: true, wig: true, order: true },
      });
      if (existing) return this.mapFull(existing, true);
      throw Object.assign(new Error('Appointment is not ready for a care report'), {
        statusCode: 409,
        code: 'INVALID_STATUS',
      });
    }

    const displayName =
      ctx.technician.displayName ??
      `${ctx.technician.user.firstName} ${ctx.technician.user.lastName}`.trim();

    const report = await prisma.careReport.upsert({
      where: { orderId },
      create: {
        wigId: ctx.order.wigId,
        orderId,
        technicianId: ctx.technician.id,
        technicianDisplayName: displayName,
        color: ctx.order.wig.color,
        lengthCm: ctx.order.wig.lengthCm,
      },
      update: {},
      include: { operations: true, photos: true, wig: true, order: true },
    });

    return this.mapFull(report, true);
  }

  async saveDraft(userId: string, orderId: string, input: SaveCareReportInput) {
    const report = await this.getWritable(userId, orderId);
    const updated = await prisma.$transaction(async (tx) => {
      const data = this.toPrismaData(input);
      const saved = await tx.careReport.update({
        where: { id: report.id },
        data,
      });
      if (input.operations) {
        await tx.careOperation.deleteMany({ where: { reportId: report.id } });
        if (input.operations.length > 0) {
          await tx.careOperation.createMany({
            data: input.operations.map((op) => ({
              reportId: report.id,
              code: op.code as CareOperationCode,
              note: op.note,
            })),
          });
        }
      }
      return tx.careReport.findUniqueOrThrow({
        where: { id: saved.id },
        include: { operations: true, photos: true, wig: true, order: true },
      });
    });
    return this.mapFull(updated, true);
  }

  async submit(userId: string, orderId: string, input: SaveCareReportInput) {
    const report = await this.getWritable(userId, orderId);
    const operations = input.operations ?? [];
    const errors = this.validateSubmit(input, operations, report.photos);
    if (errors.length > 0) {
      throw Object.assign(new Error(errors[0]), {
        statusCode: 400,
        code: 'CARE_REPORT_INCOMPLETE',
        details: errors,
      });
    }

    await new CatalogService().assertRequiredComplete(orderId);

    const submitted = await prisma.$transaction(async (tx) => {
      if (input.operations) {
        await tx.careOperation.deleteMany({ where: { reportId: report.id } });
        await tx.careOperation.createMany({
          data: operations.map((op) => ({
            reportId: report.id,
            code: op.code as CareOperationCode,
            note: op.note,
          })),
        });
      }

      const saved = await tx.careReport.update({
        where: { id: report.id },
        data: {
          ...this.toPrismaData(input),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          hairAdded: operations.some((op) => HAIR_CODES.has(op.code)),
        },
      });

      await tx.wigProfile.update({
        where: { id: report.wigId },
        data: {
          currentCondition: saved.afterGeneralCondition,
          currentWeightGrams: saved.afterWeightGrams,
          lastCareAt: saved.submittedAt,
          lastTechnicianName: saved.technicianDisplayName,
          color: saved.color ?? undefined,
          lengthCm: saved.lengthCm ?? undefined,
        },
      });

      const order = await tx.repairOrder.findUniqueOrThrow({ where: { id: orderId } });
      if (canMarkAppointmentComplete(order.status)) {
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
            reason: 'Care report submitted',
          },
        });
      }

      return tx.careReport.findUniqueOrThrow({
        where: { id: saved.id },
        include: { operations: true, photos: true, wig: true, order: true },
      });
    });

    const mapped = await this.mapFull(submitted, true);
    return {
      ...mapped,
      orderStatus: submitted.order.status,
      paymentStatus: submitted.order.paymentStatus,
      paymentMethod: submitted.order.paymentMethod,
      canConfirmCash: canConfirmCashPayment(submitted.order.status, submitted.order.paymentStatus),
    };
  }

  async listForWig(wigId: string, options: { includeInternal: boolean }) {
    const reports = await prisma.careReport.findMany({
      where: { wigId, status: 'SUBMITTED' },
      orderBy: { submittedAt: 'desc' },
      include: { operations: true, photos: true, wig: true, order: true },
    });
    return Promise.all(reports.map((r) => this.mapFull(r, options.includeInternal)));
  }

  async getWigOverview(wigId: string, includeInternal: boolean) {
    const wig = await prisma.wigProfile.findFirst({
      where: { id: wigId, archivedAt: null },
      include: {
        customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    if (!wig) {
      throw Object.assign(new Error('Wig not found'), { statusCode: 404, code: 'WIG_NOT_FOUND' });
    }
    const history = await this.listForWig(wigId, { includeInternal });
    const latest = history[0] ?? null;
    return {
      id: wig.id,
      reference: wig.reference,
      name: wig.name,
      brand: wig.brand,
      color: wig.color,
      fiberType: wig.fiberType,
      lengthCm: wig.lengthCm,
      createdAt: wig.createdAt.toISOString(),
      currentCondition: wig.currentCondition,
      currentWeightGrams: wig.currentWeightGrams,
      lastCareAt: wig.lastCareAt?.toISOString() ?? null,
      lastTechnicianName: wig.lastTechnicianName,
      customer: includeInternal
        ? {
            name: `${wig.customer.user.firstName} ${wig.customer.user.lastName}`.trim(),
            email: wig.customer.user.email,
          }
        : undefined,
      latestAdvice: latest
        ? {
            washFrequency: latest.washFrequency,
            recommendedProducts: latest.recommendedProducts,
            productsToAvoid: latest.productsToAvoid,
            stylingAdvice: latest.stylingAdvice,
            storageAdvice: latest.storageAdvice,
            heatAdvice: latest.heatAdvice,
            laceAdvice: latest.laceAdvice,
            nextCareAt: latest.nextCareAt,
            otherAdvice: latest.otherAdvice,
            technicianName: latest.technicianDisplayName,
            submittedAt: latest.submittedAt,
          }
        : null,
      history,
    };
  }

  async assertTechnicianWigAccess(userId: string, wigId: string) {
    const tech = await requireApprovedTechnicianProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: {
        wigId,
        technicianId: tech.id,
        status: { not: 'CANCELLED' },
      },
    });
    if (!order) {
      throw Object.assign(new Error('No access to this wig'), {
        statusCode: 403,
        code: 'WIG_FORBIDDEN',
      });
    }
    return tech;
  }

  async listClients(userId: string) {
    const tech = await requireApprovedTechnicianProfile(userId);
    const orders = await prisma.repairOrder.findMany({
      where: { technicianId: tech.id, status: { not: 'CANCELLED' } },
      include: {
        customer: { include: { user: { select: { firstName: true, lastName: true } } } },
        wig: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const byCustomer = new Map<
      string,
      { id: string; name: string; wigIds: Set<string>; lastAt: Date }
    >();
    for (const o of orders) {
      const id = o.customerId;
      const name = `${o.customer.user.firstName} ${o.customer.user.lastName}`.trim();
      const row = byCustomer.get(id) ?? { id, name, wigIds: new Set<string>(), lastAt: o.updatedAt };
      row.wigIds.add(o.wigId);
      if (o.updatedAt > row.lastAt) row.lastAt = o.updatedAt;
      byCustomer.set(id, row);
    }
    return [...byCustomer.values()].map((c) => ({
      id: c.id,
      name: c.name,
      wigCount: c.wigIds.size,
      lastActivityAt: c.lastAt.toISOString(),
    }));
  }

  async listClientWigs(userId: string, customerId: string) {
    const tech = await requireApprovedTechnicianProfile(userId);
    const wigs = await prisma.wigProfile.findMany({
      where: {
        customerId,
        archivedAt: null,
        orders: { some: { technicianId: tech.id, status: { not: 'CANCELLED' } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return wigs.map((w) => ({
      id: w.id,
      reference: w.reference,
      name: w.name,
      currentCondition: w.currentCondition,
      currentWeightGrams: w.currentWeightGrams,
      lastCareAt: w.lastCareAt?.toISOString() ?? null,
      lastTechnicianName: w.lastTechnicianName,
    }));
  }

  private async getWritable(userId: string, orderId: string) {
    const ctx = await this.requireAssignedOrder(userId, orderId);
    const report = await prisma.careReport.findUnique({
      where: { orderId },
      include: { operations: true, photos: true, wig: true, order: true },
    });
    if (!report) {
      throw Object.assign(new Error('Start the care form first'), {
        statusCode: 404,
        code: 'CARE_REPORT_NOT_FOUND',
      });
    }
    if (report.status === 'SUBMITTED') {
      throw Object.assign(new Error('This care report is locked'), {
        statusCode: 409,
        code: 'CARE_REPORT_LOCKED',
      });
    }
    if (report.technicianId !== ctx.technician.id) {
      throw Object.assign(new Error('No access'), { statusCode: 403, code: 'FORBIDDEN' });
    }
    return report;
  }

  private async requireAssignedOrder(userId: string, orderId: string) {
    const technician = await requireApprovedTechnicianProfile(userId);
    const withUser = await prisma.technicianProfile.findUniqueOrThrow({
      where: { id: technician.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, technicianId: technician.id },
      include: { wig: true },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    return { technician: withUser, order };
  }

  private toPrismaData(input: SaveCareReportInput): Prisma.CareReportUpdateInput {
    const hairAdded = Boolean(
      input.hairAdded ?? input.operations?.some((op) => HAIR_CODES.has(op.code)),
    );
    return {
      beforeGeneralCondition: input.beforeGeneralCondition ?? undefined,
      beforeWeightGrams: input.beforeWeightGrams ?? undefined,
      wigAgeYears: input.wigAgeYears ?? undefined,
      wigKind: input.wigKind ?? undefined,
      hairKind: input.hairKind ?? undefined,
      lengthCm: input.lengthCm ?? undefined,
      color: input.color ?? undefined,
      laceCondition: input.laceCondition ?? undefined,
      baseCondition: input.baseCondition ?? undefined,
      hairCondition: input.hairCondition ?? undefined,
      wearLevel: input.wearLevel ?? undefined,
      tangleLevel: input.tangleLevel ?? undefined,
      hairLossObserved: input.hairLossObserved ?? undefined,
      visibleDamage: input.visibleDamage ?? undefined,
      repairsNeeded: input.repairsNeeded ?? undefined,
      beforeInternalNotes: input.beforeInternalNotes ?? undefined,
      hairAdded,
      addedHairKind: input.addedHairKind ?? undefined,
      addedHairGrams: input.addedHairGrams ?? undefined,
      addedHairLengthCm: input.addedHairLengthCm ?? undefined,
      addedHairColor: input.addedHairColor ?? undefined,
      addedHairTexture: input.addedHairTexture ?? undefined,
      addedHairOrigin: input.addedHairOrigin ?? undefined,
      addedHairZone: input.addedHairZone ?? undefined,
      addedHairComment: input.addedHairComment ?? undefined,
      afterWeightGrams: input.afterWeightGrams ?? undefined,
      afterGeneralCondition: input.afterGeneralCondition ?? undefined,
      afterHairCondition: input.afterHairCondition ?? undefined,
      afterLaceCondition: input.afterLaceCondition ?? undefined,
      afterBaseCondition: input.afterBaseCondition ?? undefined,
      afterWearLevel: input.afterWearLevel ?? undefined,
      resultNotes: input.resultNotes ?? undefined,
      remainingIssues: input.remainingIssues ?? undefined,
      afterInternalNotes: input.afterInternalNotes ?? undefined,
      washFrequency: input.washFrequency ?? undefined,
      recommendedProducts: input.recommendedProducts ?? undefined,
      productsToAvoid: input.productsToAvoid ?? undefined,
      stylingAdvice: input.stylingAdvice ?? undefined,
      storageAdvice: input.storageAdvice ?? undefined,
      heatAdvice: input.heatAdvice ?? undefined,
      laceAdvice: input.laceAdvice ?? undefined,
      nextCareAt: input.nextCareAt ? new Date(input.nextCareAt) : undefined,
      otherAdvice: input.otherAdvice ?? undefined,
    };
  }

  private validateSubmit(
    input: SaveCareReportInput,
    operations: { code: string }[],
    photos: { purpose: string; photoPhase: string | null }[],
  ): string[] {
    const errors: string[] = [];
    const req = [
      ['beforeGeneralCondition', input.beforeGeneralCondition],
      ['beforeWeightGrams', input.beforeWeightGrams],
      ['wigKind', input.wigKind],
      ['hairKind', input.hairKind],
      ['lengthCm', input.lengthCm],
      ['color', input.color],
      ['laceCondition', input.laceCondition],
      ['baseCondition', input.baseCondition],
      ['hairCondition', input.hairCondition],
      ['wearLevel', input.wearLevel],
      ['tangleLevel', input.tangleLevel],
      ['afterWeightGrams', input.afterWeightGrams],
      ['afterGeneralCondition', input.afterGeneralCondition],
      ['afterHairCondition', input.afterHairCondition],
      ['afterLaceCondition', input.afterLaceCondition],
      ['afterBaseCondition', input.afterBaseCondition],
      ['afterWearLevel', input.afterWearLevel],
      ['resultNotes', input.resultNotes],
      ['washFrequency', input.washFrequency],
    ] as const;
    for (const [key, value] of req) {
      if (value == null || value === '') errors.push(`Missing ${key}`);
    }
    if (input.hairLossObserved == null) errors.push('Missing hairLossObserved');
    if (operations.length === 0) errors.push('Select at least one operation');
    const hairWork = operations.some((op) => HAIR_CODES.has(op.code));
    if (hairWork) {
      if (!input.addedHairKind) errors.push('Missing added hair type');
      if (!input.addedHairGrams) errors.push('Missing added hair weight');
      if (!input.addedHairLengthCm) errors.push('Missing added hair length');
      if (!input.addedHairColor) errors.push('Missing added hair color');
      if (!input.addedHairZone) errors.push('Missing added hair zone');
    }
    const adviceOk = [input.otherAdvice, input.stylingAdvice, input.storageAdvice, input.heatAdvice, input.laceAdvice]
      .some((v) => Boolean(v && String(v).trim()));
    if (!adviceOk) errors.push('Add at least one client advice');
    const beforePhotos = photos.filter(
      (p) => p.photoPhase === 'BEFORE' || p.purpose === 'BEFORE_CARE',
    );
    const afterPhotos = photos.filter(
      (p) => p.photoPhase === 'AFTER' || p.purpose === 'AFTER_CARE',
    );
    if (beforePhotos.length === 0) errors.push('Add at least one before photo');
    if (afterPhotos.length === 0) errors.push('Add at least one after photo');
    return errors;
  }

  private async mapFull(report: ReportRow, includeInternal: boolean) {
    const s3 = createS3Client(this.env);
    const photos = await Promise.all(
      report.photos.map(async (p) => ({
        id: p.id,
        mimeType: p.mimeType,
        purpose: p.purpose,
        phase: p.photoPhase,
        angle: p.photoAngle,
        kind: p.mimeType.startsWith('video/') ? ('video' as const) : ('image' as const),
        url: await mediaPublicUrl(this.env, s3, p.storageKey),
        createdAt: p.createdAt.toISOString(),
      })),
    );

    const weightDelta =
      report.beforeWeightGrams != null && report.afterWeightGrams != null
        ? report.afterWeightGrams - report.beforeWeightGrams
        : null;

    const client = {
      id: report.id,
      wigId: report.wigId,
      orderId: report.orderId,
      status: report.status,
      submittedAt: report.submittedAt?.toISOString() ?? null,
      technicianDisplayName: report.technicianDisplayName,
      wigReference: report.wig.reference,
      wigName: report.wig.name,
      orderNumber: report.order.orderNumber,
      beforeGeneralCondition: report.beforeGeneralCondition,
      beforeWeightGrams: report.beforeWeightGrams,
      wigAgeYears: report.wigAgeYears,
      wigKind: report.wigKind,
      hairKind: report.hairKind,
      lengthCm: report.lengthCm,
      color: report.color,
      laceCondition: report.laceCondition,
      baseCondition: report.baseCondition,
      hairCondition: report.hairCondition,
      wearLevel: report.wearLevel,
      tangleLevel: report.tangleLevel,
      hairLossObserved: report.hairLossObserved,
      operations: report.operations.map((o) => ({ code: o.code, note: o.note })),
      hairAdded: report.hairAdded,
      afterWeightGrams: report.afterWeightGrams,
      afterGeneralCondition: report.afterGeneralCondition,
      afterHairCondition: report.afterHairCondition,
      afterLaceCondition: report.afterLaceCondition,
      afterBaseCondition: report.afterBaseCondition,
      afterWearLevel: report.afterWearLevel,
      resultNotes: report.resultNotes,
      weightDeltaGrams: weightDelta,
      washFrequency: report.washFrequency,
      recommendedProducts: report.recommendedProducts,
      productsToAvoid: report.productsToAvoid,
      stylingAdvice: report.stylingAdvice,
      storageAdvice: report.storageAdvice,
      heatAdvice: report.heatAdvice,
      laceAdvice: report.laceAdvice,
      nextCareAt: report.nextCareAt?.toISOString() ?? null,
      otherAdvice: report.otherAdvice,
      photos: photos.filter((p) => p.phase === 'BEFORE' || p.phase === 'AFTER' || includeInternal),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };

    if (!includeInternal) {
      return client;
    }

    return {
      ...client,
      visibleDamage: report.visibleDamage,
      repairsNeeded: report.repairsNeeded,
      beforeInternalNotes: report.beforeInternalNotes,
      addedHairKind: report.addedHairKind,
      addedHairGrams: report.addedHairGrams,
      addedHairLengthCm: report.addedHairLengthCm,
      addedHairColor: report.addedHairColor,
      addedHairTexture: report.addedHairTexture,
      addedHairOrigin: report.addedHairOrigin,
      addedHairZone: report.addedHairZone,
      addedHairComment: report.addedHairComment,
      remainingIssues: report.remainingIssues,
      afterInternalNotes: report.afterInternalNotes,
    };
  }
}
