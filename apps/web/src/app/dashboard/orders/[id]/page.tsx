'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canAuthorizePayment, canChooseCashPayment, canReleaseEscrow } from '@velure/domain';
import type { OrderDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ReviewModal } from '@/components/reviews/review-modal';
import { StripeCheckout } from '@/components/payments/stripe-checkout';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { BookingStatusTracker } from '@/components/booking/booking-status-tracker';
import { useState, useRef } from 'react';
import type { Messages } from '@/lib/i18n/messages';

const allowSimulation = process.env.NODE_ENV !== 'production';

type PaymentIntentResult = {
  mode: 'stripe' | 'simulation';
  paymentStatus: string;
  clientSecret: string | null;
  paymentIntentId: string | null;
  publishableKey: string | null;
  amountCents: number;
  currency: string;
  message?: string;
};

function clientPaymentLabel(
  paymentStatus: string,
  t: Pick<Messages, 'payment' | 'status'>,
): string {
  if (paymentStatus === 'UNPAID' || paymentStatus === 'FAILED') return t.payment.statusDue;
  if (paymentStatus === 'AUTHORIZED' || paymentStatus === 'CAPTURING') return t.payment.statusConfirmed;
  if (paymentStatus === 'CAPTURED') return t.payment.statusPaid;
  if (paymentStatus === 'CASH_PENDING') return t.payment.statusCash;
  return formatStatus(paymentStatus, t.status);
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewThanks, setReviewThanks] = useState(false);

  const order = useQuery({
    queryKey: ['orders', params.id],
    queryFn: () => authFetch<OrderDto>(`/api/v1/orders/${params.id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 4000;
      if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'ARCHIVED') return false;
      return 4000;
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['orders', params.id] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const action = useMutation({
    mutationFn: (payload: { action: string }) =>
      authFetch<OrderDto>(`/api/v1/orders/${params.id}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          action: payload.action,
          expectedVersion: order.data?.version,
        }),
      }),
    onSuccess: invalidate,
  });

  const intentKeyRef = useRef(crypto.randomUUID());
  const releaseKeyRef = useRef(crypto.randomUUID());
  const startPayment = useMutation({
    mutationFn: () =>
      authFetch<PaymentIntentResult>(`/api/v1/orders/${params.id}/payments/intent`, {
        method: 'POST',
        headers: { 'Idempotency-Key': intentKeyRef.current },
      }),
    onSuccess: () => {
      setPayError(null);
      setPayMessage(null);
    },
    onError: (err) => {
      setPayError(err instanceof ApiClientError ? err.message : t.payment.failed);
    },
  });

  const simulatePay = useMutation({
    mutationFn: async () => {
      await authFetch(`/api/v1/orders/${params.id}/payments/intent`, {
        method: 'POST',
        headers: { 'Idempotency-Key': intentKeyRef.current },
      });
      return authFetch<{ paymentStatus: string; message: string }>(
        `/api/v1/orders/${params.id}/payments/simulate-authorize`,
        { method: 'POST' },
      );
    },
    onSuccess: async () => {
      setPayMessage(t.payment.stripeHeld);
      setPayError(null);
      await invalidate();
    },
    onError: (err) => {
      setPayError(err instanceof ApiClientError ? err.message : t.payment.simulationFailed);
    },
  });

  const cashKeyRef = useRef(crypto.randomUUID());
  const chooseCash = useMutation({
    mutationFn: () =>
      authFetch<{ paymentStatus: string }>(`/api/v1/orders/${params.id}/payments/cash`, {
        method: 'POST',
        headers: { 'Idempotency-Key': cashKeyRef.current },
      }),
    onSuccess: async () => {
      setPayError(null);
      setPayMessage(t.cash.chosen);
      await invalidate();
    },
    onError: (err) => {
      setPayError(err instanceof ApiClientError ? err.message : t.cash.failed);
    },
  });

  const cancelCash = useMutation({
    mutationFn: () =>
      authFetch<{ paymentStatus: string }>(`/api/v1/orders/${params.id}/payments/cash/cancel`, {
        method: 'POST',
      }),
    onSuccess: async () => {
      setPayError(null);
      setPayMessage(null);
      await invalidate();
    },
    onError: (err) => {
      setPayError(err instanceof ApiClientError ? err.message : t.cash.failed);
    },
  });

  const release = useMutation({
    mutationFn: () =>
      authFetch<{ paymentStatus: string }>(
        `/api/v1/orders/${params.id}/payments/release`,
        { method: 'POST', headers: { 'Idempotency-Key': releaseKeyRef.current } },
      ),
    onSuccess: async () => {
      setPayMessage(t.payment.captured);
      setPayError(null);
      await invalidate();
      setReviewOpen(true);
    },
    onError: (err) => {
      setPayError(err instanceof ApiClientError ? err.message : t.payment.releaseFailed);
    },
  });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; comment?: string }) =>
      authFetch(`/api/v1/orders/${params.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setReviewError(null);
      setReviewThanks(true);
      setReviewOpen(false);
      await invalidate();
    },
    onError: (err) => {
      setReviewError(err instanceof ApiClientError ? err.message : t.payment.reviewFailed);
    },
  });

  if (order.isLoading) {
    return <p className="text-muted">{t.common.loading}</p>;
  }

  if (!order.data) {
    return <p className="text-muted">{t.payment.notFound}</p>;
  }

  const data = order.data;
  const paymentStatus = data.paymentStatus ?? 'UNPAID';
  const paymentAllowed = canAuthorizePayment(data.status);
  const canShowPayButtons =
    paymentAllowed && (paymentStatus === 'UNPAID' || paymentStatus === 'FAILED');
  const cashOffered = canChooseCashPayment(data.status, paymentStatus, data.cashAccepted ?? false);
  const cashPending = paymentStatus === 'CASH_PENDING';
  const cashSettled = paymentStatus === 'CAPTURED' && data.paymentMethod === 'CASH';
  const stripeCheckout =
    startPayment.data?.mode === 'stripe' &&
    startPayment.data.clientSecret &&
    startPayment.data.publishableKey
      ? startPayment.data
      : null;
  const canReview =
    (paymentStatus === 'CAPTURED' || data.status === 'COMPLETED') && !data.hasReview && !reviewThanks;
  const customerActions = (data.availableActions ?? []).filter((a) =>
    ['SUBMIT', 'CANCEL', 'APPROVE_ESTIMATE', 'SCHEDULE_PICKUP', 'SCHEDULE_DELIVERY'].includes(a),
  );
  const dateLocale = intlLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.15em] text-champagne">
          {formatStatus(data.status, t.status)}
        </p>
        <h1 className="font-display text-4xl text-ink">{data.orderNumber}</h1>
        <p className="mt-2 text-muted">{data.wigName}</p>
        {data.scheduledAt ? (
          <p className="mt-1 text-sm text-muted">
            {t.payment.appointment} : {new Date(data.scheduledAt).toLocaleString(dateLocale)}
            {data.venueType
              ? ` · ${data.venueType === 'HOME' ? t.payment.homeVenue : t.payment.salonVenue}`
              : ''}
          </p>
        ) : null}
      </div>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
        <BookingStatusTracker status={data.status} lastAction={data.lastAction} />
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
        <h2 className="font-display text-2xl text-ink">{t.payment.services}</h2>
        <ul className="mt-4 space-y-2">
          {data.lineItems?.map((li) => (
            <li key={li.id} className="flex justify-between text-sm">
              <span>{li.serviceName}</span>
              <span>{formatMoney(li.lineTotalCents, data.currency, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-ink/5 pt-4 font-medium">
          <span>{t.common.total}</span>
          <span>{formatMoney(data.totalCents, data.currency, locale)}</span>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-champagne/30 bg-champagne/5 p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-champagne">{t.payment.secureLabel}</p>
        <h2 className="mt-2 font-display text-2xl text-ink">{t.payment.title}</h2>
        <p className="mt-4 font-display text-4xl text-ink">
          {formatMoney(data.totalCents, data.currency, locale)}
        </p>
        <p className="mt-2 text-sm text-ink">{clientPaymentLabel(paymentStatus, t)}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t.payment.escrowExplain}</p>

        {!paymentAllowed && (paymentStatus === 'UNPAID' || paymentStatus === 'FAILED') ? (
          <p className="mt-4 rounded-lg border border-ink/10 bg-warm-white px-4 py-3 text-sm text-ink">
            {t.payment.waitingExpert}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {canShowPayButtons ? (
            <>
              {allowSimulation ? (
                <Button
                  variant="primary"
                  disabled={simulatePay.isPending || startPayment.isPending}
                  onClick={() => simulatePay.mutate()}
                >
                  {simulatePay.isPending ? t.payment.paying : t.payment.payHold}
                </Button>
              ) : null}
              {!stripeCheckout ? (
                <Button
                  variant={allowSimulation ? 'secondary' : 'primary'}
                  disabled={startPayment.isPending}
                  onClick={() => startPayment.mutate()}
                >
                  {startPayment.isPending
                    ? t.payment.paying
                    : allowSimulation
                      ? t.payment.prepareIntent
                      : t.payment.payCard}
                </Button>
              ) : null}
              {cashOffered ? (
                <Button
                  variant="secondary"
                  disabled={chooseCash.isPending}
                  onClick={() => chooseCash.mutate()}
                >
                  {t.cash.payCash}
                </Button>
              ) : null}
            </>
          ) : null}

          {cashPending ? (
            <div className="w-full space-y-3 rounded-lg border border-ink/10 bg-warm-white px-4 py-3">
              <p className="text-sm text-ink">{t.cash.chosen}</p>
              <p className="text-sm text-muted">{t.cash.waitingConfirm}</p>
              <Button
                variant="secondary"
                disabled={cancelCash.isPending}
                onClick={() => cancelCash.mutate()}
              >
                {t.cash.cancel}
              </Button>
            </div>
          ) : null}

          {cashSettled ? <p className="text-sm text-ink">{t.cash.confirmed}</p> : null}

          {paymentStatus === 'AUTHORIZED' && canReleaseEscrow(data.status, paymentStatus) ? (
            <Button variant="gold" disabled={release.isPending} onClick={() => release.mutate()}>
              {release.isPending ? t.payment.releasing : t.payment.release}
            </Button>
          ) : null}

          {paymentStatus === 'AUTHORIZED' && !canReleaseEscrow(data.status, paymentStatus) ? (
            <p className="text-sm text-muted">{t.payment.releaseWhenComplete}</p>
          ) : null}

          {paymentStatus === 'CAPTURED' && !cashSettled ? (
            <p className="text-sm text-ink">{t.payment.captured}</p>
          ) : null}

          {canReview ? (
            <Button variant="secondary" onClick={() => setReviewOpen(true)}>
              {t.review.leaveReview}
            </Button>
          ) : null}

          {(data.hasReview || reviewThanks) &&
          (paymentStatus === 'CAPTURED' || data.status === 'COMPLETED') ? (
            <p className="text-sm text-muted">{reviewThanks ? t.review.thanks : t.review.already}</p>
          ) : null}
        </div>

        {stripeCheckout ? (
          <StripeCheckout
            clientSecret={stripeCheckout.clientSecret!}
            publishableKey={stripeCheckout.publishableKey!}
            payLabel={`${t.payment.payCard} · ${formatMoney(data.totalCents, data.currency, locale)}`}
            payingLabel={t.payment.paying}
            onSuccess={async () => {
              setPayError(null);
              try {
                await authFetch(`/api/v1/orders/${params.id}/payments/confirm`, { method: 'POST' });
                setPayMessage(t.payment.stripeHeld);
              } catch (err) {
                setPayError(err instanceof ApiClientError ? err.message : t.payment.stripeHeld);
              }
              await invalidate();
            }}
            onError={(message) => setPayError(message)}
          />
        ) : null}

        {payMessage ? <p className="mt-3 text-sm text-ink">{payMessage}</p> : null}
        {payError ? <p className="mt-3 text-sm text-red-700">{payError}</p> : null}
      </section>

      {data.customerNotes ? (
        <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
          <h2 className="font-display text-2xl text-ink">{t.payment.notes}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{data.customerNotes}</p>
        </section>
      ) : null}

      {customerActions.length > 0 ? (
        <section className="flex flex-wrap gap-3">
          {customerActions.map((act) => (
            <Button
              key={act}
              variant={act === 'CANCEL' ? 'secondary' : 'primary'}
              disabled={action.isPending}
              onClick={() => action.mutate({ action: act })}
            >
              {formatStatus(act, t.status)}
            </Button>
          ))}
        </section>
      ) : null}

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        pending={submitReview.isPending}
        error={reviewError}
        onSubmit={(payload) => submitReview.mutate(payload)}
      />
    </div>
  );
}
