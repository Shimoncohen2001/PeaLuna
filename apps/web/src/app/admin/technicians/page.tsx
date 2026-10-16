'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SparkArea } from '@/components/charts/spark-area';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { interpolate } from '@/lib/i18n/messages';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

type Period = '7' | '30' | '90' | '365' | 'all';
type SortBy =
  | 'createdAt'
  | 'bookings'
  | 'gmv'
  | 'commission'
  | 'payout'
  | 'rating'
  | 'completedRate'
  | 'cancellationRate';

type Overview = {
  period: Period;
  currency: string;
  experts: { total: number; active: number; review: number; new7: number; new30: number; newPeriod: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  finance: {
    paidCount: number;
    gmvCents: number;
    commissionCents: number;
    expertShareCents: number;
    transferredCents: number;
    cashKeptCents: number;
    cashCommissionDueCents: number;
    cashCommissionSettledCents: number;
    averageBasketCents: number;
  };
  cancellationRateBps: number;
  completionRateBps: number;
  reviews: { count: number; average: number };
  series: {
    bookings: Array<{ label: string; value: number }>;
    gmvCents: Array<{ label: string; value: number }>;
    commissionCents: Array<{ label: string; value: number }>;
  };
};

type ExpertRow = {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  city: string | null;
  status: string;
  createdAt: string;
  ratingAvg: number;
  reviewCount: number;
  bookings: number;
  completed: number;
  cancelled: number;
  paidCount: number;
  gmvCents: number;
  commissionCents: number;
  expertShareCents: number;
  transferredCents: number;
  cashKeptCents: number;
  cancellationRateBps: number;
  completionRateBps: number;
  currency: string;
};

type ExpertList = { items: ExpertRow[]; page: number; limit: number; total: number };

const PERIODS: Period[] = ['7', '30', '90', '365', 'all'];
const SORT_OPTIONS: SortBy[] = [
  'bookings',
  'gmv',
  'commission',
  'payout',
  'rating',
  'completedRate',
  'cancellationRate',
  'createdAt',
];
const STATUS_OPTIONS = ['all', 'APPROVED', 'UNDER_REVIEW', 'PENDING_APPLICATION', 'SUSPENDED', 'REJECTED'] as const;
const ACTIVITY_OPTIONS = ['all', 'booked', 'none'] as const;

export default function AdminTechniciansPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const copy = t.admin.expertsPage;
  const overviewCopy = t.admin.overview;
  const dateLocale = intlLocale(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const q = searchParams.get('q') ?? '';
  const sortBy = parseOption(searchParams.get('sortBy'), SORT_OPTIONS, 'bookings');
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  const status = parseOption(searchParams.get('status'), STATUS_OPTIONS, 'all');
  const activity = parseOption(searchParams.get('activity'), ACTIVITY_OPTIONS, 'all');
  const period = parseOption(searchParams.get('period'), PERIODS, '30');
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (search === q) return;
      replaceParams(router, pathname, searchParams, { q: search, page: '1' });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search, q, pathname, router, searchParams]);

  const listQuery = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      sortBy,
      sortOrder,
      status,
      activity,
      period,
    });
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }, [activity, page, period, q, sortBy, sortOrder, status]);

  const overview = useQuery({
    queryKey: ['admin-experts-overview', period],
    queryFn: () => authFetch<Overview>(`/api/v1/admin/experts/overview?period=${period}`),
  });
  const experts = useQuery({
    queryKey: ['admin-experts', listQuery],
    queryFn: () => authFetch<ExpertList>(`/api/v1/admin/experts?${listQuery}`),
  });

  const decide = useMutation({
    mutationFn: (payload: { id: string; action: 'approve' | 'reject' }) =>
      authFetch(`/api/v1/admin/technicians/${payload.id}/${payload.action}`, { method: 'POST' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-experts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-experts-overview'] });
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed),
  });

  const data = overview.data;
  const items = experts.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((experts.data?.total ?? 0) / 20));
  const setFilter = (patch: Record<string, string>) =>
    replaceParams(router, pathname, searchParams, { ...patch, page: '1' });

  const bookingPoints = useMemo(
    () => (data?.series.bookings ?? []).map((point) => ({ ...point, label: formatBucket(point.label, locale) })),
    [data?.series.bookings, locale],
  );
  const gmvPoints = useMemo(
    () => (data?.series.gmvCents ?? []).map((point) => ({ label: formatBucket(point.label, locale), value: point.value / 100 })),
    [data?.series.gmvCents, locale],
  );

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
              onClick={() => setFilter({ period: value })}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm transition-colors',
                period === value ? 'bg-ink text-warm-white' : 'border border-ink/10 bg-warm-white text-muted hover:border-champagne',
              )}
            >
              {periodLabel(value, overviewCopy)}
            </button>
          ))}
        </div>
      </div>

      {overview.isError ? (
        <p className="text-sm text-red-700">
          {overview.error instanceof ApiClientError ? overview.error.message : overviewCopy.loadFailed}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.total} value={overview.isLoading ? '…' : String(data?.experts.total ?? 0)} hint={copy.active + ': ' + (data?.experts.active ?? 0)} />
        <Stat
          label={copy.newPeriod}
          value={overview.isLoading ? '…' : String(data?.experts.newPeriod ?? 0)}
          hint={`${overviewCopy.new7}: ${data?.experts.new7 ?? 0} · ${overviewCopy.new30}: ${data?.experts.new30 ?? 0}`}
        />
        <Stat label={copy.reviewQueue} value={overview.isLoading ? '…' : String(data?.experts.review ?? 0)} />
        <Stat label={copy.bookings} value={overview.isLoading ? '…' : String(data?.bookings.total ?? 0)} hint={`${copy.paid}: ${data?.finance.paidCount ?? 0}`} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={copy.gmv}
          hint={copy.gmvHint}
          value={overview.isLoading ? '…' : formatMoney(data?.finance.gmvCents ?? 0, data?.currency ?? 'ILS', locale)}
        />
        <Stat
          label={copy.commission}
          hint={copy.commissionHint}
          value={overview.isLoading ? '…' : formatMoney(data?.finance.commissionCents ?? 0, data?.currency ?? 'ILS', locale)}
        />
        <Stat
          label={copy.payout}
          hint={copy.payoutHint}
          value={overview.isLoading ? '…' : formatMoney(data?.finance.expertShareCents ?? 0, data?.currency ?? 'ILS', locale)}
        />
        <Stat
          label={copy.transferred}
          hint={copy.transferredHint}
          value={overview.isLoading ? '…' : formatMoney(data?.finance.transferredCents ?? 0, data?.currency ?? 'ILS', locale)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.cashKept} hint={copy.cashKeptHint} value={overview.isLoading ? '…' : formatMoney(data?.finance.cashKeptCents ?? 0, data?.currency ?? 'ILS', locale)} />
        <Stat label={copy.cashDue} value={overview.isLoading ? '…' : formatMoney(data?.finance.cashCommissionDueCents ?? 0, data?.currency ?? 'ILS', locale)} />
        <Stat label={copy.rating} value={overview.isLoading ? '…' : `${data?.reviews.average ?? 0}`} hint={`${data?.reviews.count ?? 0} ${copy.reviews.toLowerCase()}`} />
        <Stat
          label={copy.completedRate}
          value={overview.isLoading ? '…' : formatBps(data?.completionRateBps ?? 0)}
          hint={`${copy.cancellationRate}: ${formatBps(data?.cancellationRateBps ?? 0)}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-xl text-ink">{overviewCopy.bookingsOverTime}</h2>
          {(data?.series.bookings ?? []).some((point) => point.value > 0) ? (
            <div className="mt-4"><SparkArea points={bookingPoints} /></div>
          ) : (
            <p className="mt-4 text-sm text-muted">{overviewCopy.noChartData}</p>
          )}
        </article>
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-xl text-ink">{copy.gmv}</h2>
          {(data?.series.gmvCents ?? []).some((point) => point.value > 0) ? (
            <div className="mt-4"><SparkArea points={gmvPoints} color="#c9a962" /></div>
          ) : (
            <p className="mt-4 text-sm text-muted">{overviewCopy.noChartData}</p>
          )}
        </article>
      </section>

      <div className="space-y-3 rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-4">
        <label className="block text-sm text-muted" htmlFor="admin-expert-search">{copy.search}</label>
        <input
          id="admin-expert-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-11 w-full rounded-full border border-ink/10 bg-beige/30 px-4 text-sm text-ink outline-none focus:border-champagne"
        />
        <div className="flex flex-wrap gap-2">
          <Select label={copy.sort} value={sortBy} onChange={(value) => setFilter({ sortBy: value })} options={SORT_OPTIONS.map((value) => ({ value, label: sortLabel(value, copy) }))} />
          <Select label={copy.sort} value={sortOrder} onChange={(value) => setFilter({ sortOrder: value })} options={[{ value: 'desc', label: copy.newest }, { value: 'asc', label: copy.oldest }]} />
          <Select label={copy.filterAll} value={status} onChange={(value) => setFilter({ status: value })} options={STATUS_OPTIONS.map((value) => ({ value, label: value === 'all' ? copy.filterAll : formatStatus(value, t.status) }))} />
          <Select label={copy.activityAll} value={activity} onChange={(value) => setFilter({ activity: value })} options={ACTIVITY_OPTIONS.map((value) => ({ value, label: value === 'all' ? copy.activityAll : value === 'booked' ? copy.activityBooked : copy.activityNone }))} />
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {experts.isError ? (
        <p className="text-sm text-red-700">
          {experts.error instanceof ApiClientError ? experts.error.message : overviewCopy.loadFailed}
        </p>
      ) : null}

      {experts.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-muted">{copy.empty}</p>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-ink/5 bg-warm-white">
          <p className="border-b border-ink/5 px-5 py-3 text-sm text-muted">
            {interpolate(copy.results, { n: experts.data?.total ?? 0 })}
          </p>
          <ul className="divide-y divide-ink/5 md:hidden">
            {items.map((expert) => (
              <li key={expert.id} className="px-5 py-4">
                <Link href={`/admin/technicians/${expert.id}?period=${period}`} className="block">
                  <p className="font-medium text-ink">{expert.name}</p>
                  <p className="text-sm text-muted">{expert.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatStatus(expert.status, t.status)} · {copy.bookings}: {expert.bookings} · {copy.paid}: {expert.paidCount}
                  </p>
                  <p className="mt-1 text-sm text-champagne">{formatMoney(expert.gmvCents, expert.currency, locale)}</p>
                </Link>
                {expert.status === 'UNDER_REVIEW' || expert.status === 'PENDING_APPLICATION' ? (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: expert.id, action: 'approve' })}>{copy.approve}</Button>
                    <Button size="sm" variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: expert.id, action: 'reject' })}>{copy.reject}</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink/5 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{copy.profile}</th>
                  <th className="px-5 py-3 font-medium">{copy.bookings}</th>
                  <th className="px-5 py-3 font-medium">{copy.gmv}</th>
                  <th className="px-5 py-3 font-medium">{copy.commission}</th>
                  <th className="px-5 py-3 font-medium">{copy.payout}</th>
                  <th className="px-5 py-3 font-medium">{copy.rating}</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {items.map((expert) => (
                  <tr key={expert.id} className="hover:bg-beige/40">
                    <td className="px-5 py-4">
                      <Link href={`/admin/technicians/${expert.id}?period=${period}`} className="block">
                        <p className="font-medium text-ink">{expert.name}</p>
                        <p className="text-muted">{expert.email}</p>
                        <p className="mt-1 text-xs text-muted">
                          {formatStatus(expert.status, t.status)}
                          {expert.city ? ` · ${expert.city}` : ''}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {expert.bookings}
                      <span className="block text-xs text-muted">
                        {copy.paid}: {expert.paidCount} · {formatBps(expert.completionRateBps)}
                      </span>
                    </td>
                    <td className="px-5 py-4">{formatMoney(expert.gmvCents, expert.currency, locale)}</td>
                    <td className="px-5 py-4">{formatMoney(expert.commissionCents, expert.currency, locale)}</td>
                    <td className="px-5 py-4">
                      {formatMoney(expert.expertShareCents, expert.currency, locale)}
                      {expert.transferredCents > 0 ? (
                        <span className="block text-xs text-muted">{copy.transferred}: {formatMoney(expert.transferredCents, expert.currency, locale)}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {expert.reviewCount ? `${expert.ratingAvg.toFixed(1)} · ${expert.reviewCount}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/technicians/${expert.id}?period=${period}`} className="text-sm text-champagne hover:underline">{copy.openDossier}</Link>
                      {expert.status === 'UNDER_REVIEW' || expert.status === 'PENDING_APPLICATION' ? (
                        <div className="mt-2 flex justify-end gap-2">
                          <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: expert.id, action: 'approve' })}>{copy.approve}</Button>
                          <Button size="sm" variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: expert.id, action: 'reject' })}>{copy.reject}</Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-ink/5 px-5 py-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => replaceParams(router, pathname, searchParams, { page: String(page - 1) })} className="text-champagne disabled:text-muted">{t.admin.customersPage.prevPage}</button>
              <p className="text-muted">{interpolate(t.admin.customersPage.pageOf, { page, pages: totalPages })}</p>
              <button type="button" disabled={page >= totalPages} onClick={() => replaceParams(router, pathname, searchParams, { page: String(page + 1) })} className="text-champagne disabled:text-muted">{t.admin.customersPage.nextPage}</button>
            </div>
          ) : null}
        </section>
      )}
    </div>
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs text-muted">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-full border border-ink/10 bg-beige/30 px-3 text-sm text-ink outline-none focus:border-champagne">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function sortLabel(value: SortBy, copy: { sortCreated: string; sortBookings: string; sortGmv: string; sortCommission: string; sortPayout: string; sortRating: string; sortCompleted: string; sortCancelled: string }) {
  if (value === 'createdAt') return copy.sortCreated;
  if (value === 'gmv') return copy.sortGmv;
  if (value === 'commission') return copy.sortCommission;
  if (value === 'payout') return copy.sortPayout;
  if (value === 'rating') return copy.sortRating;
  if (value === 'completedRate') return copy.sortCompleted;
  if (value === 'cancellationRate') return copy.sortCancelled;
  return copy.sortBookings;
}

function replaceParams(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: URLSearchParams,
  patch: Record<string, string>,
) {
  const next = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(patch)) {
    const omit =
      !value.trim() ||
      (key === 'page' && value === '1') ||
      (key === 'sortBy' && value === 'bookings') ||
      (key === 'sortOrder' && value === 'desc') ||
      (key === 'status' && value === 'all') ||
      (key === 'activity' && value === 'all') ||
      (key === 'period' && value === '30');
    if (omit) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname);
}

function parseOption<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
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
