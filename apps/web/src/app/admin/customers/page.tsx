'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { interpolate } from '@/lib/i18n/messages';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  roles: string[];
  bookings: number;
  cancelled: number;
  spentCents: number;
  paidCount: number;
  averageBasketCents: number;
  currency: string;
  lastBookingAt: string | null;
};

type AdminCustomerList = {
  items: AdminCustomer[];
  page: number;
  limit: number;
  total: number;
};

const SORT_OPTIONS = ['createdAt', 'bookings', 'spent'] as const;
const STATUS_OPTIONS = ['all', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'] as const;
const ACTIVITY_OPTIONS = ['all', 'booked', 'none'] as const;

export default function AdminCustomersPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const copy = t.admin.customersPage;
  const dateLocale = intlLocale(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const sortBy = parseOption(searchParams.get('sortBy'), SORT_OPTIONS, 'createdAt');
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  const status = parseOption(searchParams.get('status'), STATUS_OPTIONS, 'all');
  const activity = parseOption(searchParams.get('activity'), ACTIVITY_OPTIONS, 'all');
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  const [search, setSearch] = useState(q);
  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (search === q) return;
      replaceParams(router, pathname, searchParams, { q: search, page: '1' });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search, q, pathname, router, searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      sortBy,
      sortOrder,
      status,
      activity,
    });
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }, [activity, page, q, sortBy, sortOrder, status]);

  const customers = useQuery({
    queryKey: ['admin-customers', queryString],
    queryFn: () => authFetch<AdminCustomerList>(`/api/v1/admin/customers?${queryString}`),
  });

  const totalPages = Math.max(1, Math.ceil((customers.data?.total ?? 0) / 20));
  const items = customers.data?.items ?? [];

  const setFilter = (patch: Record<string, string>) => {
    replaceParams(router, pathname, searchParams, { ...patch, page: '1' });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
        <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{copy.subtitle}</p>
        <Link href="/admin" className="mt-3 inline-block text-sm text-champagne hover:underline">
          {t.nav.adminHome}
        </Link>
      </div>

      <div className="space-y-3 rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-4">
        <label className="block text-sm text-muted" htmlFor="admin-customer-search">
          {copy.search}
        </label>
        <input
          id="admin-customer-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-11 w-full rounded-full border border-ink/10 bg-beige/30 px-4 text-sm text-ink outline-none focus:border-champagne"
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label={copy.sort}
            value={sortBy}
            onChange={(value) => setFilter({ sortBy: value })}
            options={SORT_OPTIONS.map((value) => ({
              value,
              label:
                value === 'createdAt'
                  ? copy.sortCreated
                  : value === 'bookings'
                    ? copy.sortBookings
                    : copy.sortSpent,
            }))}
          />
          <FilterSelect
            label={copy.sort}
            value={sortOrder}
            onChange={(value) => setFilter({ sortOrder: value })}
            options={[
              { value: 'desc', label: copy.newest },
              { value: 'asc', label: copy.oldest },
            ]}
          />
          <FilterSelect
            label={copy.filterAll}
            value={status}
            onChange={(value) => setFilter({ status: value })}
            options={STATUS_OPTIONS.map((value) => ({
              value,
              label:
                value === 'all'
                  ? copy.filterAll
                  : value === 'ACTIVE'
                    ? copy.statusActive
                    : value === 'PENDING_VERIFICATION'
                      ? copy.statusPending
                      : copy.statusSuspended,
            }))}
          />
          <FilterSelect
            label={copy.activityAll}
            value={activity}
            onChange={(value) => setFilter({ activity: value })}
            options={ACTIVITY_OPTIONS.map((value) => ({
              value,
              label:
                value === 'all'
                  ? copy.activityAll
                  : value === 'booked'
                    ? copy.activityBooked
                    : copy.activityNone,
            }))}
          />
        </div>
      </div>

      {customers.isError ? (
        <p className="text-sm text-red-700">
          {customers.error instanceof ApiClientError ? customers.error.message : t.admin.overview.loadFailed}
        </p>
      ) : null}

      {customers.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-muted">{copy.empty}</p>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-ink/5 bg-warm-white">
          <p className="border-b border-ink/5 px-5 py-3 text-sm text-muted">
            {interpolate(copy.results, { n: customers.data?.total ?? 0 })}
          </p>

          <ul className="divide-y divide-ink/5 md:hidden">
            {items.map((customer) => (
              <li key={customer.id}>
                <Link href={`/admin/customers/${customer.id}`} className="block px-5 py-4 hover:bg-beige/40">
                  <p className="font-medium text-ink">{customer.name || customer.email}</p>
                  <p className="text-sm text-muted">{customer.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    {customer.phone || copy.noPhone}
                    {' · '}
                    {statusLabel(customer.status, copy)}
                    {roleFlags(customer.roles, copy)}
                  </p>
                  <p className="mt-2 text-sm text-ink">
                    {copy.bookings}: {customer.bookings}
                    {customer.cancelled ? ` · ${copy.cancelled}: ${customer.cancelled}` : ''}
                  </p>
                  <p className="text-sm text-champagne">
                    {formatMoney(customer.spentCents, customer.currency, locale)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink/5 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{copy.profile}</th>
                  <th className="px-5 py-3 font-medium">{copy.phone}</th>
                  <th className="px-5 py-3 font-medium">{copy.signedUp}</th>
                  <th className="px-5 py-3 font-medium">{copy.bookings}</th>
                  <th className="px-5 py-3 font-medium">{copy.spent}</th>
                  <th className="px-5 py-3 font-medium">{copy.lastBooking}</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">{copy.openDossier}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {items.map((customer) => (
                  <tr key={customer.id} className="hover:bg-beige/40">
                    <td className="px-5 py-4">
                      <Link href={`/admin/customers/${customer.id}`} className="block">
                        <p className="font-medium text-ink">{customer.name || customer.email}</p>
                        <p className="text-muted">{customer.email}</p>
                        <p className="mt-1 text-xs text-muted">
                          {statusLabel(customer.status, copy)}
                          {roleFlags(customer.roles, copy)}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted">{customer.phone || copy.noPhone}</td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(customer.createdAt).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="px-5 py-4 text-ink">
                      {customer.bookings}
                      {customer.cancelled ? (
                        <span className="block text-xs text-muted">
                          {copy.cancelled}: {customer.cancelled}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-ink">{formatMoney(customer.spentCents, customer.currency, locale)}</p>
                      {customer.paidCount > 0 ? (
                        <p className="text-xs text-muted">
                          {copy.average}: {formatMoney(customer.averageBasketCents, customer.currency, locale)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {customer.lastBookingAt
                        ? new Date(customer.lastBookingAt).toLocaleDateString(dateLocale)
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-sm text-champagne hover:underline"
                      >
                        {copy.openDossier}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-ink/5 px-5 py-3 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => replaceParams(router, pathname, searchParams, { page: String(page - 1) })}
                className="text-champagne disabled:text-muted"
              >
                {copy.prevPage}
              </button>
              <p className="text-muted">{interpolate(copy.pageOf, { page, pages: totalPages })}</p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => replaceParams(router, pathname, searchParams, { page: String(page + 1) })}
                className="text-champagne disabled:text-muted"
              >
                {copy.nextPage}
              </button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function FilterSelect({
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-10 rounded-full border border-ink/10 bg-beige/30 px-3 text-sm text-ink outline-none focus:border-champagne',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
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
      (key === 'sortBy' && value === 'createdAt') ||
      (key === 'sortOrder' && value === 'desc') ||
      (key === 'status' && value === 'all') ||
      (key === 'activity' && value === 'all');
    if (omit) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname);
}

function parseOption<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function statusLabel(
  status: string,
  copy: { statusActive: string; statusPending: string; statusSuspended: string },
) {
  if (status === 'ACTIVE') return copy.statusActive;
  if (status === 'PENDING_VERIFICATION') return copy.statusPending;
  if (status === 'SUSPENDED') return copy.statusSuspended;
  return formatStatus(status);
}

function roleFlags(
  roles: string[],
  copy: { alsoExpert: string; alsoAdmin: string },
) {
  const flags = [
    roles.includes('TECHNICIAN') ? copy.alsoExpert : null,
    roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') ? copy.alsoAdmin : null,
  ].filter(Boolean);
  return flags.length ? ` · ${flags.join(' · ')}` : '';
}
