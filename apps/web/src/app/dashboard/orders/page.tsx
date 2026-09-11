'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { OrderDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus } from '@/lib/format';

export default function OrdersPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => authFetch<OrderDto[]>('/api/v1/orders'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">{t.orders.title}</h1>
          <p className="mt-2 text-muted">{t.orders.subtitle}</p>
        </div>
        <Link href="/dashboard/book">
          <Button variant="primary">{t.orders.newBooking}</Button>
        </Link>
      </div>

      {orders.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : (orders.data?.length ?? 0) === 0 ? (
        <p className="text-muted">{t.orders.empty}</p>
      ) : (
        <ul className="space-y-3">
          {orders.data!.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-ink/5 bg-warm-white px-4 py-4 hover:border-champagne/40"
              >
                <div>
                  <p className="font-medium text-ink">{order.orderNumber}</p>
                  <p className="text-sm text-muted">
                    {order.wigName} · {formatStatus(order.status, t.status)}
                  </p>
                </div>
                <p className="text-sm text-ink">{formatMoney(order.totalCents, order.currency, locale)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
