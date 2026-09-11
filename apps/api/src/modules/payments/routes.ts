import { successResponse } from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { withIdempotency } from '../../lib/idempotency.js';
import { PaymentService } from './payment.service.js';
import Stripe from 'stripe';

export async function paymentRoutes(app: AppInstance, env: Env): Promise<void> {
  const payments = new PaymentService(env);

  app.post(
    `${API_PREFIX}/orders/:id/payments/intent`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await withIdempotency({
        header: request.headers['idempotency-key'],
        requireKey: env.NODE_ENV === 'production',
        userId: user.sub,
        method: 'POST',
        path: `${API_PREFIX}/orders/${id}/payments/intent`,
        body: { orderId: id },
        statusCode: 200,
        execute: () => payments.createPaymentIntent(id, user.sub),
      });
      return reply.status(result.statusCode).send(successResponse(result.payload, request.requestId));
    },
  );

  if (env.NODE_ENV !== 'production') {
    app.post(
      `${API_PREFIX}/orders/:id/payments/simulate-authorize`,
      { preHandler: [app.authenticate] },
      async (request, reply) => {
        const user = requireUser(request);
        const { id } = request.params as { id: string };
        const result = await payments.simulateAuthorize(id, user.sub);
        return reply.send(successResponse(result, request.requestId));
      },
    );
  }

  app.post(
    `${API_PREFIX}/orders/:id/payments/release`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await withIdempotency({
        header: request.headers['idempotency-key'],
        requireKey: env.NODE_ENV === 'production',
        userId: user.sub,
        method: 'POST',
        path: `${API_PREFIX}/orders/${id}/payments/release`,
        body: { orderId: id },
        statusCode: 200,
        execute: () => payments.releaseEscrow(id, user.sub),
      });
      return reply.status(result.statusCode).send(successResponse(result.payload, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/orders/:id/payments/confirm`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const { id } = request.params as { id: string };
      const result = await payments.confirmFromClient(id, user.sub);
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.post(
    `${API_PREFIX}/technicians/me/stripe/onboard`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const result = await payments.createConnectOnboardingLink(user.sub);
      return reply.send(successResponse(result, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/technicians/me/stripe/status`,
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = requireUser(request);
      const result = await payments.syncConnectStatus(user.sub);
      return reply.send(successResponse(result, request.requestId));
    },
  );

  // Stripe webhook — raw body required for signature verification
  await app.register(async (webhookApp) => {
    webhookApp.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req, body, done) => {
        done(null, body);
      },
    );

    webhookApp.post(`${API_PREFIX}/webhooks/stripe`, async (request, reply) => {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
        return reply.status(503).send({ error: 'Stripe webhook not configured' });
      }

      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const signature = request.headers['stripe-signature'];
      if (!signature || Array.isArray(signature)) {
        return reply.status(400).send({ error: 'Missing signature' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          request.body as Buffer,
          signature,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        request.log.warn({ err }, 'Stripe webhook signature failed');
        return reply.status(400).send({ error: 'Invalid signature' });
      }

      if (
        event.type === 'payment_intent.amount_capturable_updated' ||
        event.type === 'payment_intent.succeeded'
      ) {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.status === 'requires_capture') {
          await payments.markAuthorizedFromWebhook(pi.id, event.id);
        }
      }

      return reply.send({ received: true });
    });
  });
}
