'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useLocale } from '@/lib/i18n/locale';
import { catalogServiceLabels } from '@/lib/i18n/catalog';
import { useState } from 'react';

type ProOrder = {
  id: string;
  orderNumber: string;
  status: string;
  scheduledAt: string | null;
  customerName: string;
  services: string[];
  totalCents: number;
  currency: string;
};

export default function ProOrdersPage() {
  const { authFetch, user } = useAuth();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isTech = user?.roles?.includes('TECHNICIAN');

  const orders = useQuery({
    queryKey: ['pro-orders'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<ProOrder[]>('/api/v1/technicians/me/orders'),
    retry: false,
    refetchInterval: (query) => {
      const rows = query.state.data ?? [];
      if (rows.some((o) => o.status === 'WAITING_FOR_TECHNICIAN' || o.status === 'ACCEPTED' || o.status === 'PICKUP_SCHEDULED' || o.status === 'IN_REPAIR')) {
        return 5000;
      }
      return false;
    },
  });

  const respond = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'accept' | 'decline' }) =>
      authFetch(`/api/v1/technicians/me/orders/${id}/${decision}`, { method: 'POST' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.common.actionFailed);
    },
  });

  if (!isTech) {
    return <p className="text-white/60">{t.common.requiredProfile}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-[#e8b4a2]">{t.nav.proOrders}</h1>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {orders.isLoading ? (
        <p className="text-white/50">{t.common.loading}</p>
      ) : (orders.data?.length ?? 0) === 0 ? (
        <p className="text-white/50">{t.pro.none}</p>
      ) : (
        <ul className="space-y-3">
          {orders.data!.map((o) => (
            <li key={o.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/pro/orders/${o.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-[#f7efe8]">{o.customerName}</p>
                  <p className="text-sm text-white/50">
                    {o.orderNumber} · {catalogServiceLabels(locale, o.services).join(', ')}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatStatus(o.status, t.status)}
                    {o.scheduledAt
                      ? ` · ${new Date(o.scheduledAt).toLocaleString(intlLocale(locale))}`
                      : ''}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[#e8b4a2]">{formatMoney(o.totalCents, o.currency, locale)}</p>
                  <Link href={`/pro/orders/${o.id}`} className="text-xs text-[#e8b4a2] hover:underline">
                    {t.job.open}
                  </Link>
                  {o.status === 'WAITING_FOR_TECHNICIAN' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ id: o.id, decision: 'accept' })}
                      >
                        {t.job.accept}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ id: o.id, decision: 'decline' })}
                      >
                        {t.job.decline}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
