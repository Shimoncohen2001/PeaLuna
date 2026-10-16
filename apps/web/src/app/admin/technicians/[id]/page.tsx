'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { catalogServiceName } from '@/lib/i18n/catalog';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

type Period = '7' | '30' | '90' | '365' | 'all';

type ExpertDetail = {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string | null;
  salonAddress: string | null;
  offersHomeService: boolean;
  offersSalonService: boolean;
  acceptsCashPayment: boolean;
  stripeReady: boolean;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  ratingAvg: number;
  reviewCount: number;
  currency: string;
  period: Period;
  summary: {
    bookings: number;
    completed: number;
    cancelled: number;
    paidCount: number;
    gmvCents: number;
    commissionCents: number;
    expertShareCents: number;
    transferredCents: number;
    cashKeptCents: number;
    cashCommissionDueCents: number;
    cashCommissionSettledCents: number;
    averageBasketCents: number;
    cancellationRateBps: number;
    completionRateBps: number;
  };
  services: Array<{
    slug: string;
    name: string;
    basePriceCents: number;
    priceCents: number;
    custom: boolean;
    currency: string;
  }>;
  skills: string[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    orderNumber: string;
    customerName: string;
  }>;
  bookings: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalCents: number;
    platformFeeCents: number;
    expertShareCents: number;
    currency: string;
    createdAt: string;
    scheduledAt: string | null;
    completedAt: string | null;
    venueType: string | null;
    customerName: string;
    wigName: string | null;
    services: Array<{ slug: string; name: string }>;
  }>;
};

const PERIODS: Period[] = ['7', '30', '90', '365', 'all'];

export default function AdminExpertDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const copy = t.admin.expertsPage;
  const overviewCopy = t.admin.overview;
  const dateLocale = intlLocale(locale);
  const queryClient = useQueryClient();
  const period = PERIODS.includes(searchParams.get('period') as Period)
    ? (searchParams.get('period') as Period)
    : '30';

  const dossier = useQuery({
    queryKey: ['admin-expert', params.id, period],
    queryFn: () => authFetch<ExpertDetail>(`/api/v1/admin/experts/${params.id}?period=${period}`),
    enabled: Boolean(params.id),
  });

  const decide = useMutation({
    mutationFn: (action: 'approve' | 'reject') =>
      authFetch(`/api/v1/admin/technicians/${params.id}/${action}`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-expert', params.id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-experts'] });
    },
  });

  if (dossier.isLoading) return <p className="text-muted">{t.common.loading}</p>;
  if (dossier.isError) {
    const message =
      dossier.error instanceof ApiClientError && dossier.error.status === 404
        ? copy.notFound
        : dossier.error instanceof ApiClientError
          ? dossier.error.message
          : overviewCopy.loadFailed;
    return (
      <div className="space-y-4">
        <BackLink label={copy.backToList} />
        <p className="text-sm text-red-700">{message}</p>
      </div>
    );
  }

  const data = dossier.data;
  if (!data) return null;
  const money = (cents: number) => formatMoney(cents, data.currency, locale);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <BackLink label={copy.backToList} />
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{data.name}</h1>
          <p className="mt-2 text-muted">
            {formatStatus(data.status, t.status)}
            {data.city ? ` · ${data.city}` : ''}
            {` · ${data.stripeReady ? copy.stripeReady : copy.stripeMissing}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((value) => (
            <Link
              key={value}
              href={`/admin/technicians/${data.id}?period=${value}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm',
                period === value ? 'bg-ink text-warm-white' : 'border border-ink/10 text-muted',
              )}
            >
              {periodLabel(value, overviewCopy)}
            </Link>
          ))}
        </div>
      </div>

      {data.status === 'UNDER_REVIEW' || data.status === 'PENDING_APPLICATION' ? (
        <div className="flex gap-2">
          <Button disabled={decide.isPending} onClick={() => decide.mutate('approve')}>{copy.approve}</Button>
          <Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate('reject')}>{copy.reject}</Button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.bookings} value={String(data.summary.bookings)} hint={`${copy.paid}: ${data.summary.paidCount}`} />
        <Stat label={copy.gmv} hint={copy.gmvHint} value={money(data.summary.gmvCents)} />
        <Stat label={copy.commission} hint={copy.commissionHint} value={money(data.summary.commissionCents)} />
        <Stat label={copy.payout} hint={copy.payoutHint} value={money(data.summary.expertShareCents)} />
        <Stat label={copy.transferred} hint={copy.transferredHint} value={money(data.summary.transferredCents)} />
        <Stat label={copy.cashKept} hint={copy.cashKeptHint} value={money(data.summary.cashKeptCents)} />
        <Stat label={copy.cashDue} value={money(data.summary.cashCommissionDueCents)} />
        <Stat
          label={copy.rating}
          value={data.reviewCount ? data.ratingAvg.toFixed(1) : '—'}
          hint={`${data.reviewCount} · ${formatBps(data.summary.completionRateBps)} ${copy.completedRate.toLowerCase()}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.profile}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t.auth.email} value={data.email} />
            {data.headline ? <Row label={copy.profile} value={data.headline} /> : null}
            <Row label={copy.city} value={[data.salonAddress, data.city, data.postalCode].filter(Boolean).join(' · ') || '—'} />
            <Row label={copy.signedUp} value={new Date(data.createdAt).toLocaleString(dateLocale)} />
            <Row
              label={copy.services}
              value={[
                data.offersHomeService ? copy.home : null,
                data.offersSalonService ? copy.salon : null,
                data.acceptsCashPayment ? copy.cash : null,
                data.yearsExperience != null ? `${data.yearsExperience}y` : null,
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            />
            {data.bio ? <Row label={copy.profile} value={data.bio} /> : null}
          </dl>
        </article>
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.services}</h2>
          {data.services.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{copy.servicesEmpty}</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {data.services.map((service) => (
                <li key={service.slug} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">{catalogServiceName(locale, service.slug, service.name)}</span>
                  <span className="text-muted">
                    {formatMoney(service.priceCents, service.currency, locale)}
                    {service.custom ? ` · ${copy.priceCustom}` : ` · ${copy.priceBase}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.skills.length > 0 ? <p className="mt-4 text-xs text-champagne">{data.skills.join(' · ')}</p> : null}
        </article>
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
        <h2 className="font-display text-2xl text-ink">{copy.reviews}</h2>
        {data.reviews.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{copy.reviewsEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {data.reviews.map((review) => (
              <li key={review.id} className="py-3">
                <p className="text-sm text-ink">
                  {review.rating}/5 · {review.customerName} · {review.orderNumber}
                </p>
                {review.comment ? <p className="mt-1 text-sm text-muted">{review.comment}</p> : null}
                <p className="mt-1 text-xs text-muted">{new Date(review.createdAt).toLocaleString(dateLocale)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
        <h2 className="font-display text-2xl text-ink">{copy.history}</h2>
        {data.bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{copy.historyEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {data.bookings.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-ink">{booking.orderNumber}</p>
                  <p className="text-sm text-muted">
                    {formatStatus(booking.status, t.status)} · {booking.customerName}
                    {booking.wigName ? ` · ${booking.wigName}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {booking.paymentStatus === 'CAPTURED'
                      ? `${copy.captured} · ${booking.paymentMethod === 'CASH' ? copy.cash : 'Card'}`
                      : copy.unpaidBooking}
                    {' · '}
                    {new Date(booking.scheduledAt ?? booking.createdAt).toLocaleString(dateLocale)}
                  </p>
                  {booking.services.length > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      {booking.services.map((service) => catalogServiceName(locale, service.slug, service.name)).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink">{money(booking.totalCents)}</p>
                  <p className="text-xs text-muted">
                    {copy.commission}: {money(booking.platformFeeCents)}
                  </p>
                  <p className="text-xs text-champagne">
                    {copy.payout}: {money(booking.expertShareCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/admin/technicians" className="text-sm text-champagne hover:underline">
      <span className="inline-block rtl:rotate-180">←</span> {label}
    </Link>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function periodLabel(period: Period, copy: { period7: string; period30: string; period90: string; periodYear: string; periodAll: string }) {
  if (period === '7') return copy.period7;
  if (period === '30') return copy.period30;
  if (period === '90') return copy.period90;
  if (period === '365') return copy.periodYear;
  return copy.periodAll;
}

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}
