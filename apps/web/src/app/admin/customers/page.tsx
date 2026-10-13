'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { intlLocale } from '@/lib/format';

type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  roles: string[];
  bookings: number;
};

export default function AdminCustomersPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const copy = t.admin.customersPage;
  const dateLocale = intlLocale(locale);

  const customers = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => authFetch<AdminCustomer[]>('/api/v1/admin/customers'),
  });

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

      {customers.isError ? (
        <p className="text-sm text-red-700">
          {customers.error instanceof ApiClientError ? customers.error.message : t.admin.overview.loadFailed}
        </p>
      ) : null}

      {customers.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : (customers.data?.length ?? 0) === 0 ? (
        <p className="text-muted">{copy.empty}</p>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-ink/5 bg-warm-white">
          <p className="border-b border-ink/5 px-5 py-3 text-sm text-muted">
            {copy.count}: {customers.data?.length}
          </p>
          <ul className="divide-y divide-ink/5">
            {customers.data?.map((customer) => (
              <li key={customer.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{customer.name || customer.email}</p>
                  <p className="text-sm text-muted">{customer.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    {statusLabel(customer.status, copy)}
                    {customer.roles.includes('TECHNICIAN') ? ` · ${copy.alsoExpert}` : ''}
                    {customer.roles.includes('ADMIN') || customer.roles.includes('SUPER_ADMIN')
                      ? ` · ${copy.alsoAdmin}`
                      : ''}
                  </p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>
                    {copy.bookings}: {customer.bookings}
                  </p>
                  <p className="text-xs">
                    {new Date(customer.createdAt).toLocaleString(dateLocale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function statusLabel(
  status: string,
  copy: { statusActive: string; statusPending: string; statusSuspended: string },
) {
  if (status === 'ACTIVE') return copy.statusActive;
  if (status === 'PENDING_VERIFICATION') return copy.statusPending;
  if (status === 'SUSPENDED') return copy.statusSuspended;
  return status;
}
