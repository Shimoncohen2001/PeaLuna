import Stripe from 'stripe';
import {
  calculatePlatformCommissionCents,
  calculateTechnicianPayoutCents,
  canAuthorizePayment,
  canReleaseEscrow,
  PLATFORM_COMMISSION_BPS,
} from '@velure/domain';
import { prisma, Prisma } from '@velure/database';
import type { Env } from '../../config/env.js';
import { requireCustomerProfile } from '../../lib/access.js';

export class PaymentService {
  private readonly stripe: Stripe | null;

  constructor(private readonly env: Env) {
    this.stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
  }

  isLive(): boolean {
    return Boolean(this.stripe);
  }

  /**
   * Create (or reuse) a PaymentIntent with manual capture = escrow hold.
   * Without Stripe keys: returns simulation mode payload.
   */
  async createPaymentIntent(orderId: string, userId: string) {
    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: {
        technician: true,
        transactions: { where: { type: 'CHARGE' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (!canAuthorizePayment(order.status)) {
      throw Object.assign(
        new Error('Payment is locked until the expert accepts this appointment'),
        { statusCode: 403, code: 'PAYMENT_AWAITING_EXPERT' },
      );
    }
    if (order.paymentStatus === 'CAPTURED') {
      throw Object.assign(new Error('Order already paid'), { statusCode: 409, code: 'ALREADY_PAID' });
    }
    if (order.paymentStatus === 'AUTHORIZED' && order.transactions[0]?.stripePaymentIntentId) {
      return {
        mode: this.stripe ? 'stripe' : 'simulation',
        paymentStatus: order.paymentStatus,
        clientSecret: null as string | null,
        paymentIntentId: order.transactions[0].stripePaymentIntentId,
        publishableKey: this.env.STRIPE_PUBLISHABLE_KEY ?? null,
        amountCents: order.totalCents,
        platformFeeCents: order.platformFeeCents,
        technicianPayoutCents: calculateTechnicianPayoutCents(order.totalCents),
        currency: order.currency,
      };
    }

    if (!this.stripe) {
      if (this.env.NODE_ENV === 'production') {
        throw Object.assign(new Error('Payments are not configured'), {
          statusCode: 503,
          code: 'PAYMENTS_NOT_CONFIGURED',
        });
      }
      // Simulation: create pending transaction, wait for /simulate-authorize
      const tx = await prisma.transaction.upsert({
        where: {
          stripePaymentIntentId: `sim_pi_${order.id}`,
        },
        create: {
          orderId: order.id,
          type: 'CHARGE',
          status: 'PENDING',
          amountCents: order.totalCents,
          currency: order.currency,
          stripePaymentIntentId: `sim_pi_${order.id}`,
          metadata: { mode: 'simulation' },
        },
        update: {
          status: 'PENDING',
          amountCents: order.totalCents,
        },
      });

      return {
        mode: 'simulation' as const,
        paymentStatus: order.paymentStatus,
        clientSecret: null,
        paymentIntentId: tx.stripePaymentIntentId,
        publishableKey: null,
        amountCents: order.totalCents,
        platformFeeCents: order.platformFeeCents,
        technicianPayoutCents: calculateTechnicianPayoutCents(order.totalCents),
        currency: order.currency,
        message: 'Mode simulation (pas de clé Stripe). Utilise « Simuler le paiement » pour bloquer les fonds.',
      };
    }

    const platformFee = calculatePlatformCommissionCents(order.totalCents);
    const connectedAccountId = order.technician?.stripeConnectAccountId;

        const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: order.totalCents,
      currency: order.currency.toLowerCase(),
      capture_method: 'manual',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        platformFeeCents: String(platformFee),
      },
      automatic_payment_methods: { enabled: true },
    };

    // Destination charge when technician has Connect onboarding complete
    if (connectedAccountId && order.technician?.stripeOnboardingComplete) {
      intentParams.application_fee_amount = platformFee;
      intentParams.transfer_data = { destination: connectedAccountId };
    }

    const existingPi = order.transactions[0]?.stripePaymentIntentId;
    let intent: Stripe.PaymentIntent;

    if (existingPi && !existingPi.startsWith('sim_')) {
      intent = await this.stripe.paymentIntents.retrieve(existingPi);
      if (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation') {
        // reuse
      } else if (intent.status === 'requires_capture') {
        await prisma.repairOrder.update({
          where: { id: order.id },
          data: { paymentStatus: 'AUTHORIZED' },
        });
      } else if (intent.status === 'canceled' || intent.status === 'succeeded') {
        intent = await this.stripe.paymentIntents.create(intentParams, {
          idempotencyKey: `order_pi_${order.id}_${intent.status}`,
        });
      } else {
        intent = await this.stripe.paymentIntents.create(intentParams, {
          idempotencyKey: `order_pi_${order.id}`,
        });
      }
    } else {
      intent = await this.stripe.paymentIntents.create(intentParams, {
        idempotencyKey: `order_pi_${order.id}`,
      });
    }

    await prisma.transaction.upsert({
      where: { stripePaymentIntentId: intent.id },
      create: {
        orderId: order.id,
        type: 'CHARGE',
        status: 'PENDING',
        amountCents: order.totalCents,
        currency: order.currency,
        stripePaymentIntentId: intent.id,
        metadata: { platformFeeCents: platformFee },
      },
      update: {
        amountCents: order.totalCents,
        status: 'PENDING',
      },
    });

    return {
      mode: 'stripe' as const,
      paymentStatus: order.paymentStatus,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      publishableKey: this.env.STRIPE_PUBLISHABLE_KEY ?? null,
      amountCents: order.totalCents,
      platformFeeCents: platformFee,
      technicianPayoutCents: calculateTechnicianPayoutCents(order.totalCents),
      currency: order.currency,
    };
  }

  /** Dev / demo: authorize escrow without Stripe */
  async simulateAuthorize(orderId: string, userId: string) {
    if (this.env.NODE_ENV === 'production') {
      throw Object.assign(new Error('Simulation disabled in production'), {
        statusCode: 403,
        code: 'SIMULATION_DISABLED',
      });
    }

    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }
    if (!canAuthorizePayment(order.status)) {
      throw Object.assign(
        new Error('Payment is locked until the expert accepts this appointment'),
        { statusCode: 403, code: 'PAYMENT_AWAITING_EXPERT' },
      );
    }
    if (order.paymentStatus === 'CAPTURED') {
      throw Object.assign(new Error('Already captured'), { statusCode: 409, code: 'ALREADY_PAID' });
    }

    const piId = `sim_pi_${order.id}`;
    await prisma.$transaction([
      prisma.transaction.upsert({
        where: { stripePaymentIntentId: piId },
        create: {
          orderId: order.id,
          type: 'CHARGE',
          status: 'PROCESSING',
          amountCents: order.totalCents,
          currency: order.currency,
          stripePaymentIntentId: piId,
          metadata: { mode: 'simulation', authorizedAt: new Date().toISOString() },
        },
        update: {
          status: 'PROCESSING',
          metadata: { mode: 'simulation', authorizedAt: new Date().toISOString() },
        },
      }),
      prisma.repairOrder.update({
        where: { id: order.id },
        data: { paymentStatus: 'AUTHORIZED' },
      }),
    ]);

    return {
      paymentStatus: 'AUTHORIZED' as const,
      message: 'Fonds bloqués en escrow (simulation). Valide le service pour libérer le paiement.',
    };
  }

  /**
   * Customer validates a completed service → capture escrow + record commission.
   * Claims AUTHORIZED → CAPTURING atomically so concurrent releases cannot double-transfer.
   */
  async releaseEscrow(orderId: string, userId: string): Promise<{
    paymentStatus: 'CAPTURED';
    platformFeeCents: number;
    technicianPayoutCents: number;
    message: string;
  }> {
    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: {
        technician: true,
        transactions: { where: { type: 'CHARGE' }, orderBy: { createdAt: 'desc' }, take: 1 },
        commission: true,
      },
    });

    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }

    if (order.paymentStatus === 'CAPTURED') {
      const platformFee = calculatePlatformCommissionCents(order.totalCents);
      const technicianPayout = calculateTechnicianPayoutCents(order.totalCents);
      return {
        paymentStatus: 'CAPTURED' as const,
        platformFeeCents: platformFee,
        technicianPayoutCents: technicianPayout,
        message: 'Service déjà validé — escrow déjà libéré.',
      };
    }

    if (order.paymentStatus === 'CAPTURING') {
      return this.finishEscrowCapture(order.id);
    }

    if (!canReleaseEscrow(order.status, order.paymentStatus)) {
      throw Object.assign(
        new Error('Payment can only be released after the expert completes the service'),
        { statusCode: 409, code: 'RELEASE_NOT_ALLOWED' },
      );
    }

    const charge = order.transactions[0];
    if (!charge?.stripePaymentIntentId) {
      throw Object.assign(new Error('Missing payment intent'), {
        statusCode: 409,
        code: 'MISSING_PAYMENT',
      });
    }

    const claimed = await prisma.repairOrder.updateMany({
      where: { id: order.id, paymentStatus: 'AUTHORIZED', status: 'COMPLETED' },
      data: { paymentStatus: 'CAPTURING' },
    });
    if (claimed.count === 0) {
      const latest = await prisma.repairOrder.findUniqueOrThrow({ where: { id: order.id } });
      if (latest.paymentStatus === 'CAPTURED') {
        const platformFee = calculatePlatformCommissionCents(order.totalCents);
        const technicianPayout = calculateTechnicianPayoutCents(order.totalCents);
        return {
          paymentStatus: 'CAPTURED' as const,
          platformFeeCents: platformFee,
          technicianPayoutCents: technicianPayout,
          message: 'Service déjà validé — escrow déjà libéré.',
        };
      }
      throw Object.assign(new Error('Payment is already being captured'), {
        statusCode: 409,
        code: 'RELEASE_IN_PROGRESS',
      });
    }

    try {
      return await this.finishEscrowCapture(order.id);
    } catch (err) {
      await prisma.repairOrder.updateMany({
        where: { id: order.id, paymentStatus: 'CAPTURING' },
        data: { paymentStatus: 'AUTHORIZED' },
      });
      throw err;
    }
  }

  private async finishEscrowCapture(orderId: string) {
    const order = await prisma.repairOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        technician: true,
        transactions: { where: { type: 'CHARGE' }, orderBy: { createdAt: 'desc' }, take: 1 },
        commission: true,
      },
    });

    const charge = order.transactions[0];
    if (!charge?.stripePaymentIntentId) {
      throw Object.assign(new Error('Missing payment intent'), {
        statusCode: 409,
        code: 'MISSING_PAYMENT',
      });
    }

    const platformFee = calculatePlatformCommissionCents(order.totalCents);
    const technicianPayout = calculateTechnicianPayoutCents(order.totalCents);
    let transferId: string | undefined;

    if (this.stripe && !charge.stripePaymentIntentId.startsWith('sim_')) {
      const intent = await this.stripe.paymentIntents.capture(charge.stripePaymentIntentId, undefined, {
        idempotencyKey: `order_capture_${order.id}`,
      });

      const dest = order.technician?.stripeConnectAccountId;
      if (
        dest &&
        order.technician?.stripeOnboardingComplete &&
        !intent.transfer_data?.destination
      ) {
        const existingTransfer = await prisma.transaction.findFirst({
          where: { orderId: order.id, type: 'TRANSFER' },
        });
        if (!existingTransfer) {
          const transfer = await this.stripe.transfers.create(
            {
              amount: technicianPayout,
              currency: order.currency.toLowerCase(),
              destination: dest,
              transfer_group: order.id,
              metadata: { orderId: order.id },
            },
            { idempotencyKey: `order_transfer_${order.id}` },
          );
          transferId = transfer.id;
        } else {
          transferId = existingTransfer.stripeTransferId ?? undefined;
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: charge.id },
        data: {
          status: 'SUCCEEDED',
          stripeTransferId: transferId,
          metadata: {
            ...(typeof charge.metadata === 'object' && charge.metadata ? charge.metadata : {}),
            capturedAt: new Date().toISOString(),
            technicianPayoutCents: technicianPayout,
            platformFeeCents: platformFee,
          },
        },
      });

      await tx.repairOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'CAPTURED',
        },
      });

      if (!order.commission) {
        await tx.platformCommission.create({
          data: {
            orderId: order.id,
            grossCents: order.totalCents,
            commissionBps: PLATFORM_COMMISSION_BPS,
            commissionCents: platformFee,
            technicianCents: technicianPayout,
            currency: order.currency,
          },
        });
      }

      if (transferId) {
        await tx.transaction.upsert({
          where: { stripeTransferId: transferId },
          create: {
            orderId: order.id,
            type: 'TRANSFER',
            status: 'SUCCEEDED',
            amountCents: technicianPayout,
            currency: order.currency,
            stripeTransferId: transferId,
          },
          update: { status: 'SUCCEEDED' },
        });
      }
    });

    return {
      paymentStatus: 'CAPTURED' as const,
      platformFeeCents: platformFee,
      technicianPayoutCents: technicianPayout,
      message: 'Service validé — escrow libéré (80% experte / 20% plateforme).',
    };
  }

  /** Cancel an uncaptured PaymentIntent when the customer/ops cancels the order. */
  async voidAuthorization(orderId: string) {
    const claimed = await prisma.repairOrder.updateMany({
      where: { id: orderId, paymentStatus: 'AUTHORIZED' },
      data: { paymentStatus: 'VOIDED' },
    });
    if (claimed.count === 0) return;

    const charge = await prisma.transaction.findFirst({
      where: { orderId, type: 'CHARGE' },
      orderBy: { createdAt: 'desc' },
    });
    const piId = charge?.stripePaymentIntentId;
    if (this.stripe && piId && !piId.startsWith('sim_')) {
      try {
        await this.stripe.paymentIntents.cancel(piId, undefined, {
          idempotencyKey: `order_void_${orderId}`,
        });
      } catch (err) {
        await prisma.repairOrder.updateMany({
          where: { id: orderId, paymentStatus: 'VOIDED' },
          data: { paymentStatus: 'AUTHORIZED' },
        });
        throw err;
      }
    }

    if (charge) {
      await prisma.transaction.update({
        where: { id: charge.id },
        data: { status: 'CANCELLED' },
      });
    }
  }

  private async claimStripeEvent(eventId: string, type: string): Promise<boolean> {
    try {
      await prisma.stripeEvent.create({ data: { id: eventId, type } });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return false;
      }
      throw err;
    }
  }

  async markAuthorizedFromWebhook(paymentIntentId: string, eventId: string) {
    const first = await this.claimStripeEvent(eventId, 'payment_authorized');
    if (!first) return;

    const tx = await prisma.transaction.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!tx) return;

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'PROCESSING', stripeEventId: eventId },
      }),
      prisma.repairOrder.updateMany({
        where: { id: tx.orderId, paymentStatus: { in: ['UNPAID', 'FAILED'] } },
        data: { paymentStatus: 'AUTHORIZED' },
      }),
    ]);
  }

  async confirmFromClient(orderId: string, userId: string) {
    if (!this.stripe) {
      throw Object.assign(new Error('Payments are not configured'), {
        statusCode: 503,
        code: 'PAYMENTS_NOT_CONFIGURED',
      });
    }

    const customer = await requireCustomerProfile(userId);
    const order = await prisma.repairOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: {
        transactions: { where: { type: 'CHARGE' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!order) {
      throw Object.assign(new Error('Order not found'), { statusCode: 404, code: 'ORDER_NOT_FOUND' });
    }

    const paymentIntentId = order.transactions[0]?.stripePaymentIntentId;
    if (!paymentIntentId || paymentIntentId.startsWith('sim_')) {
      throw Object.assign(new Error('No Stripe payment to confirm'), {
        statusCode: 409,
        code: 'PAYMENT_NOT_FOUND',
      });
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'requires_capture' && intent.status !== 'succeeded') {
      throw Object.assign(new Error('Card was not authorized'), {
        statusCode: 409,
        code: 'PAYMENT_NOT_AUTHORIZED',
      });
    }

    await this.markAuthorizedFromWebhook(paymentIntentId, `client_confirm_${intent.id}`);
    return { paymentStatus: 'AUTHORIZED' as const };
  }

  async createConnectOnboardingLink(userId: string) {
    if (!this.stripe) {
      throw Object.assign(new Error('Stripe is not configured'), {
        statusCode: 503,
        code: 'STRIPE_UNAVAILABLE',
      });
    }

    const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!profile || profile.status !== 'APPROVED') {
      throw Object.assign(new Error('Technician profile required'), {
        statusCode: 403,
        code: 'TECHNICIAN_REQUIRED',
      });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    let accountId = profile.stripeConnectAccountId;
    if (!accountId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: profile.serviceCountryCode ?? 'IL',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { technicianId: profile.id },
      });
      accountId = account.id;
      await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${this.env.WEB_ORIGIN}/pro?stripe=refresh`,
      return_url: `${this.env.WEB_ORIGIN}/pro?stripe=return`,
      type: 'account_onboarding',
    });

    return { url: link.url, accountId };
  }

  async syncConnectStatus(userId: string) {
    if (!this.stripe) {
      return { configured: false, onboardingComplete: false };
    }
    const profile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!profile?.stripeConnectAccountId) {
      return { configured: false, onboardingComplete: false };
    }

    const account = await this.stripe.accounts.retrieve(profile.stripeConnectAccountId);
    const complete = Boolean(account.charges_enabled && account.payouts_enabled);
    await prisma.technicianProfile.update({
      where: { id: profile.id },
      data: { stripeOnboardingComplete: complete },
    });
    return {
      configured: true,
      onboardingComplete: complete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  }
}
