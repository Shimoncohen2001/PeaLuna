'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney } from '@/lib/format';

type CashCommission = {
  id: string;
  orderNumber: string;
  technicianName: string;
  technicianEmail: string | null;
  grossCents: number;
  commissionCents: number;
  currency: string;
  confirmedAt: string | null;
  settledAt: string | null;
};

export default function AdminCashCommissionsPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'fr' ? 'fr-FR' : 'en-GB';

  const commissions = useQuery({
    queryKey: ['admin-cash-commissions', settled],
    queryFn: () =>
      authFetch<CashCommission[]>(`/api/v1/admin/cash-commissions?settled=${settled}`),
  });

  const settle = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/v1/admin/cash-commissions/${id}/settle`, { method: 'POST' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-cash-commissions'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  const total = (commissions.data ?? []).reduce((sum, row) => sum + row.commissionCents, 0);
  const currency = commissions.data?.[0]?.currency ?? 'ILS';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.cash.adminTitle}</h1>
          {!settled && total > 0 ? (
            <p className="mt-2 text-muted">
              {t.cash.adminDue} : {formatMoney(total, currency, locale)}
            </p>
          ) : null}
        </div>
        <Link href="/admin/technicians" className="text-sm text-champagne hover:underline">
          {t.admin.expertsTitle}
        </Link>
      </div>

      <div className="flex gap-2">
        <Button variant={settled ? 'secondary' : 'primary'} onClick={() => setSettled(false)}>
          {t.cash.adminTabDue}
        </Button>
        <Button variant={settled ? 'primary' : 'secondary'} onClick={() => setSettled(true)}>
          {t.cash.adminTabSettled}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {commissions.isLoading ? <p className="text-muted">{t.common.loading}</p> : null}

      {commissions.data?.length === 0 ? (
        <p className="text-muted">{t.cash.adminEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {commissions.data?.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5"
            >
              <div>
                <p className="font-medium text-ink">{row.technicianName}</p>
                <p className="text-sm text-muted">
                  {row.orderNumber}
                  {row.technicianEmail ? ` · ${row.technicianEmail}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatMoney(row.grossCents, row.currency, locale)} ·{' '}
                  {row.confirmedAt
                    ? new Date(row.confirmedAt).toLocaleDateString(dateLocale)
                    : '—'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-2xl text-ink">
                  {formatMoney(row.commissionCents, row.currency, locale)}
                </span>
                {row.settledAt ? (
                  <span className="text-sm text-muted">{t.cash.adminSettled}</span>
                ) : (
                  <Button
                    variant="primary"
                    disabled={settle.isPending}
                    onClick={() => settle.mutate(row.id)}
                  >
                    {t.cash.adminSettle}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
