'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SparkArea } from '@/components/charts/spark-area';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { ApiClientError } from '@/lib/api-client';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

type Period = '7' | '30' | '90' | '365' | 'all';

type DashboardData = {
  period: Period;
  currency: string;
  customers: { total: number; new7: number; new30: number };
  bookings: { pending: number; confirmed: number; completed: number; cancelled: number };
  bookingsTotal: number;
  revenue: {
    gmvCents: number;
    commissionCents: number;
    paidCount: number;
    averageBasketCents: number;
  };
  cancellationRateBps: number;
  experts: { approved: number; review: number };
  series: {
    grain: 'day' | 'week' | 'month';
    bookings: Array<{ label: string; value: number }>;
    gmvCents: Array<{ label: string; value: number }>;
  };
  recent: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    scheduledAt: string | null;
    paymentStatus: string;
    customerName: string;
    technicianName: string | null;
  }>;
};

const PERIODS: Period[] = ['7', '30', '90', '365', 'all'];

export default function AdminDashboardPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<Period>('30');
  const copy = t.admin.overview;
  const dateLocale = intlLocale(locale);

  const dashboard = useQuery({
    queryKey: ['admin-dashboard', period],
    queryFn: () => authFetch<DashboardData>(`/api/v1/admin/dashboard?period=${period}`),
  });

  const data = dashboard.data;
  const bookingPoints = useMemo(
    () => (data?.series.bookings ?? []).map((point) => ({ ...point, label: formatBucket(point.label, locale) })),
    [data?.series.bookings, locale],
  );
  const revenuePoints = useMemo(
    () =>
      (data?.series.gmvCents ?? []).map((point) => ({
        label: formatBucket(point.label, locale),
        value: point.value / 100,
      })),
    [data?.series.gmvCents, locale],
  );
  const hasBookingTrend = (data?.series.bookings ?? []).some((point) => point.value > 0);
  const hasRevenueTrend = (data?.series.gmvCents ?? []).some((point) => point.value > 0);

  const statusParts = data
    ? [
        { key: 'pending' as const, label: copy.pending, value: data.bookings.pending, color: '#e8b4a2' },
        { key: 'confirmed' as const, label: copy.confirmed, value: data.bookings.confirmed, color: '#c9a962' },
        { key: 'completed' as const, label: copy.completed, value: data.bookings.completed, color: '#1a1214' },
        { key: 'cancelled' as const, label: copy.cancelled, value: data.bookings.cancelled, color: '#b7a8a2' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                period === value
                  ? 'bg-ink text-warm-white'
                  : 'border border-ink/10 bg-warm-white text-muted hover:border-champagne hover:text-ink',
              )}
            >
              {periodLabel(value, copy)}
            </button>
          ))}
        </div>
      </div>

      {dashboard.isError ? (
        <p className="text-sm text-red-700">
          {dashboard.error instanceof ApiClientError ? dashboard.error.message : copy.loadFailed}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/customers" className="block rounded-[var(--radius-card)] transition hover:ring-1 hover:ring-champagne/40">
          <StatCard label={copy.customers} hint={copy.customersHint} loading={dashboard.isLoading}>
            {data ? data.customers.total : null}
          </StatCard>
        </Link>
        <StatCard label={copy.new7} loading={dashboard.isLoading}>
          {data ? data.customers.new7 : null}
        </StatCard>
        <StatCard label={copy.new30} loading={dashboard.isLoading}>
          {data ? data.customers.new30 : null}
        </StatCard>
        <StatCard label={copy.cancellationRate} hint={copy.bookings} loading={dashboard.isLoading}>
          {data ? formatBps(data.cancellationRateBps) : null}
        </StatCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label={copy.gmv} hint={copy.gmvHint} loading={dashboard.isLoading}>
          {data ? formatMoney(data.revenue.gmvCents, data.currency, locale) : null}
        </StatCard>
        <StatCard label={copy.commission} loading={dashboard.isLoading}>
          {data ? formatMoney(data.revenue.commissionCents, data.currency, locale) : null}
        </StatCard>
        <StatCard
          label={copy.averageBasket}
          hint={data ? `${copy.paidOrders}: ${data.revenue.paidCount}` : undefined}
          loading={dashboard.isLoading}
        >
          {data ? formatMoney(data.revenue.averageBasketCents, data.currency, locale) : null}
        </StatCard>
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
        <h2 className="font-display text-2xl text-ink">{copy.bookings}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {statusParts.map((part) => (
            <div key={part.key} className="rounded-2xl border border-ink/5 bg-blush/30 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{part.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{dashboard.isLoading ? '…' : part.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          {dashboard.isLoading ? (
            <p className="text-sm text-muted">{t.common.loading}</p>
          ) : dashboard.isError ? null : data && data.bookingsTotal > 0 ? (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-beige">
                {statusParts
                  .filter((part) => part.value > 0)
                  .map((part) => (
                    <div
                      key={part.key}
                      title={`${part.label}: ${part.value}`}
                      className="h-full"
                      style={{
                        width: `${(part.value / data.bookingsTotal) * 100}%`,
                        backgroundColor: part.color,
                      }}
                    />
                  ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {copy.bookings}: {data.bookingsTotal}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">{copy.noChartData}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
          <h2 className="font-display text-xl text-ink">{copy.bookingsOverTime}</h2>
          {dashboard.isLoading ? (
            <p className="mt-6 text-sm text-muted">{t.common.loading}</p>
          ) : dashboard.isError ? null : hasBookingTrend ? (
            <div className="mt-4">
              <SparkArea points={bookingPoints} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{copy.noChartData}</p>
          )}
        </div>
        <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
          <h2 className="font-display text-xl text-ink">{copy.revenueOverTime}</h2>
          {dashboard.isLoading ? (
            <p className="mt-6 text-sm text-muted">{t.common.loading}</p>
          ) : dashboard.isError ? null : hasRevenueTrend ? (
            <div className="mt-4">
              <SparkArea points={revenuePoints} color="#c9a962" />
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">{copy.noChartData}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/technicians"
          className="rounded-[var(--radius-card)] border border-ink/5 bg-blush/40 p-6 hover:border-champagne/50"
        >
          <p className="text-sm text-muted">{copy.expertsReview}</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {dashboard.isLoading ? '…' : (data?.experts.review ?? 0)}
          </p>
        </Link>
        <Link
          href="/admin/technicians"
          className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6 hover:border-champagne/50"
        >
          <p className="text-sm text-muted">{copy.expertsApproved}</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {dashboard.isLoading ? '…' : (data?.experts.approved ?? 0)}
          </p>
        </Link>
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
        <h2 className="font-display text-2xl text-ink">{copy.recent}</h2>
        {dashboard.isLoading ? (
          <p className="mt-4 text-sm text-muted">{t.common.loading}</p>
        ) : (data?.recent.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted">{copy.noneRecent}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {data!.recent.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">{order.customerName}</p>
                  <p className="text-sm text-muted">
                    {order.orderNumber} · {formatStatus(order.status, t.status)}
                    {order.technicianName ? ` · ${order.technicianName}` : ''}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(order.scheduledAt ?? order.createdAt).toLocaleString(dateLocale)}
                  </p>
                </div>
                <p className="text-sm text-champagne">{formatMoney(order.totalCents, order.currency, locale)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  hint,
  loading,
  children,
}: {
  label: string;
  hint?: string;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{loading ? '…' : children}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
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

function formatBucket(label: string, locale: string): string {
  if (/^\d{4}-W\d{2}$/.test(label)) return label.replace('-W', ' W');
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [year, month] = label.split('-');
    return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString(intlLocale(locale), {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(`${label}T00:00:00.000Z`).toLocaleDateString(intlLocale(locale), {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  }
  return label;
}
