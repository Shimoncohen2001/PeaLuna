'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { OrderDto, WigDto } from '@velure/contracts';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus } from '@/lib/format';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { authFetch, user } = useAuth();
  const { t, format } = useLocale();

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => authFetch<OrderDto[]>('/api/v1/orders'),
  });

  const wigs = useQuery({
    queryKey: ['wigs'],
    queryFn: () => authFetch<WigDto[]>('/api/v1/wigs'),
  });

  const recent = orders.data?.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {format(t.dashboard.hello, { name: user?.firstName ?? '' })}
        </h1>
        <p className="mt-2 text-muted">{t.dashboard.subtitle}</p>
      </div>

      <div className="action-row">
        <Link href="/dashboard/book">
          <Button variant="primary">{t.dashboard.bookCare}</Button>
        </Link>
        <Link href="/dashboard/wigs">
          <Button variant="secondary">{t.dashboard.addWig}</Button>
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
          <p className="text-sm text-muted">{t.dashboard.wigs}</p>
          <p className="mt-2 font-display text-3xl text-ink">{wigs.data?.length ?? '—'}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6">
          <p className="text-sm text-muted">{t.dashboard.appointments}</p>
          <p className="mt-2 font-display text-3xl text-ink">{orders.data?.length ?? '—'}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">{t.dashboard.upcoming}</h2>
          <Link href="/dashboard/orders" className="text-sm text-champagne hover:underline">
            {t.dashboard.seeAll}
          </Link>
        </div>
        {orders.isLoading ? (
          <p className="text-muted">{t.common.loading}</p>
        ) : recent.length === 0 ? (
          <p className="text-muted">{t.dashboard.noAppointments}</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between rounded-xl border border-ink/5 bg-warm-white px-4 py-3 hover:border-champagne/40"
                >
                  <div>
                    <p className="font-medium text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {order.wigName} · {formatStatus(order.status, t.status)}
                    </p>
                  </div>
                  <p className="text-sm text-ink">{formatMoney(order.totalCents, order.currency)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
