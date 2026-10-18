import { Prisma, prisma } from '@velure/database';
import { bookingRequestEmail, createMailer, type Mailer } from '../../infrastructure/mailer.js';
import { loadEnv } from '../../config/env.js';

export const BOOKING_REQUEST = 'BOOKING_REQUEST';

export type BookingRequestNotice = {
  technicianUserId: string;
  technicianEmail: string;
  technicianLocale: string;
  technicianFirstName: string;
  orderId: string;
  orderNumber: string;
  scheduledAt: Date | string | null;
  venueType: string | null;
  serviceNames: string[];
  customerName: string;
};

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  payload: Record<string, unknown> | null;
};

function copyFor(locale: string) {
  if (locale.startsWith('he')) {
    return {
      title: 'בקשת תור חדשה',
      body: (customer: string, services: string, when: string) =>
        `${customer} שלחה בקשת תור (עדיין לא מאושרת) עבור ${services} ב-${when}.`,
    };
  }
  if (locale.startsWith('fr')) {
    return {
      title: 'Nouvelle demande de réservation',
      body: (customer: string, services: string, when: string) =>
        `${customer} a envoyé une demande de réservation (pas encore confirmée) pour ${services} le ${when}.`,
    };
  }
  return {
    title: 'New booking request',
    body: (customer: string, services: string, when: string) =>
      `${customer} sent a booking request (not confirmed yet) for ${services} on ${when}.`,
  };
}

function formatWhen(scheduledAt: Date | string | null, locale: string) {
  if (!scheduledAt) return locale.startsWith('he') ? 'מועד לתאום' : locale.startsWith('fr') ? 'date à confirmer' : 'time to confirm';
  const date = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return locale.startsWith('he') ? 'מועד לתאום' : locale.startsWith('fr') ? 'date à confirmer' : 'time to confirm';
  }
  const intl = locale.startsWith('he') ? 'he-IL' : locale.startsWith('fr') ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(intl, {
    timeZone: 'Asia/Jerusalem',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function hrefFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const href = (payload as { href?: unknown }).href;
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') ? href : null;
}

function mapRow(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Prisma.JsonValue;
  readAt: Date | null;
  createdAt: Date;
}): InAppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: hrefFromPayload(row.payload),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    payload: row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : null,
  };
}

export class NotificationService {
  private readonly mailer: Mailer;
  private readonly webOrigin: string;

  constructor(deps?: { mailer?: Mailer; webOrigin?: string }) {
    const env = deps?.mailer && deps.webOrigin ? null : loadEnv();
    this.mailer = deps?.mailer ?? createMailer(env!);
    this.webOrigin = (deps?.webOrigin ?? env?.WEB_ORIGIN ?? 'https://pealuna.com').replace(/\/$/, '');
  }

  async notifyBookingRequest(input: BookingRequestNotice): Promise<void> {
    const copy = copyFor(input.technicianLocale);
    const services = input.serviceNames.filter(Boolean).join(', ') || (input.technicianLocale.startsWith('he') ? 'טיפול' : 'care');
    const when = formatWhen(input.scheduledAt, input.technicianLocale);
    const href = `/pro/orders/${input.orderId}`;
    const payload = {
      kind: BOOKING_REQUEST,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      href,
      scheduledAt: input.scheduledAt
        ? new Date(input.scheduledAt).toISOString()
        : null,
      venueType: input.venueType,
      serviceNames: input.serviceNames,
      customerName: input.customerName,
    };

    const inAppKey = {
      userId: input.technicianUserId,
      channel: 'IN_APP' as const,
      type: BOOKING_REQUEST,
      entityId: input.orderId,
    };
    try {
      await prisma.notification.upsert({
        where: { notifications_dedupe: inAppKey },
        create: {
          ...inAppKey,
          status: 'SENT',
          title: copy.title,
          body: copy.body(input.customerName, services, when),
          payload,
          sentAt: new Date(),
        },
        update: {},
      });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
        throw err;
      }
    }

    const emailKey = {
      userId: input.technicianUserId,
      channel: 'EMAIL' as const,
      type: BOOKING_REQUEST,
      entityId: input.orderId,
    };
    const existingEmail = await prisma.notification.findUnique({
      where: { notifications_dedupe: emailKey },
    });
    if (existingEmail?.status === 'SENT') return;

    const emailRow = {
      ...emailKey,
      title: copy.title,
      body: copy.body(input.customerName, services, when),
      payload,
    };

    try {
      await this.mailer.send(
        bookingRequestEmail({
          to: input.technicianEmail,
          expertFirstName: input.technicianFirstName,
          customerName: input.customerName,
          services,
          when,
          orderNumber: input.orderNumber,
          orderUrl: `${this.webOrigin}${href}`,
        }),
      );
      await prisma.notification.upsert({
        where: { notifications_dedupe: emailKey },
        create: { ...emailRow, status: 'SENT', sentAt: new Date() },
        update: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      console.error('[mail] booking request email not sent', err);
      try {
        await prisma.notification.upsert({
          where: { notifications_dedupe: emailKey },
          create: { ...emailRow, status: 'FAILED' },
          update: { status: 'FAILED' },
        });
      } catch (inner) {
        console.error('[notifications] could not record failed email', inner);
      }
    }
  }

  async listForUser(userId: string, page: number, limit: number) {
    const where = { userId, channel: 'IN_APP' as const };
    const [total, rows] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { total, items: rows.map(mapRow) };
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, channel: 'IN_APP', readAt: null },
    });
  }

  async markRead(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({
      where: { id, userId, channel: 'IN_APP' },
    });
    if (!existing) {
      throw Object.assign(new Error('Notification not found'), {
        statusCode: 404,
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }
    if (existing.readAt) return mapRow(existing);
    const updated = await prisma.notification.update({
      where: { id: existing.id },
      data: { readAt: new Date(), status: 'READ' },
    });
    return mapRow(updated);
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, channel: 'IN_APP', readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    return { updated: result.count };
  }
}
