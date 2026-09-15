'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { SparkArea } from '@/components/charts/spark-area';
import { useLocale } from '@/lib/i18n/locale';

type DashboardData = {
  stats: {
    totalAppointments: number;
    ongoing: number;
    revenueCents: number;
    ratingAvg: number;
    reviewCount: number;
  };
  series: {
    days: Array<{ date: string; bookings: number; revenueCents: number }>;
  };
  upcoming: Array<{
    id: string;
    orderNumber: string;
    status: string;
    scheduledAt: string | null;
    customerName: string;
    services: string[];
    totalCents: number;
  }>;
};

export default function ProDashboardPage() {
  const { authFetch, user } = useAuth();
  const { t, locale } = useLocale();
  const isTech = user?.roles?.includes('TECHNICIAN');

  const application = useQuery({
    queryKey: ['tech-me'],
    enabled: !isTech,
    queryFn: () => authFetch<{ status: string }>('/api/v1/technicians/me'),
    retry: false,
  });

  const dashboard = useQuery({
    queryKey: ['pro-dashboard'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<DashboardData>('/api/v1/technicians/me/dashboard'),
    retry: false,
  });

  const bookingPoints = useMemo(
    () =>
      (dashboard.data?.series.days ?? []).map((d) => ({
        label: d.date,
        value: d.bookings,
      })),
    [dashboard.data?.series.days],
  );

  const revenuePoints = useMemo(
    () =>
      (dashboard.data?.series.days ?? []).map((d) => ({
        label: d.date,
        value: d.revenueCents / 100,
      })),
    [dashboard.data?.series.days],
  );

  if (!isTech) {
    const status = application.data?.status;
    const pending = status === 'UNDER_REVIEW' || status === 'PENDING_APPLICATION';
    const rejected = status === 'REJECTED';
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl text-[#e8b4a2]">{t.pro.reserved}</h1>
        <p className="text-white/70">
          {rejected ? t.pro.applyRejected : pending ? t.pro.pendingReview : t.pro.reservedHint}
        </p>
        <Link href="/pro/apply">
          <Button variant="gold">{rejected ? t.pro.resubmit : pending ? t.pro.applyEdit : t.pro.createProfile}</Button>
        </Link>
      </div>
    );
  }

  const stats = dashboard.data?.stats;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#e8b4a2]">{t.pro.eyebrow}</p>
        <h1 className="font-display text-4xl text-[#f7efe8]">{t.pro.title}</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.pro.appointments, value: stats?.totalAppointments ?? '—' },
          { label: t.pro.ongoing, value: stats?.ongoing ?? '—' },
          {
            label: t.pro.revenue,
            value: stats ? formatMoney(stats.revenueCents, 'ILS', locale) : '—',
          },
          {
            label: t.pro.rating,
            value: stats ? `${stats.ratingAvg.toFixed(1)}/5` : '—',
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/50">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-[#e8b4a2]">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl text-[#f7efe8]">{t.pro.bookings14}</h2>
          <p className="mt-1 text-sm text-white/45">{t.pro.bookings14hint}</p>
          {dashboard.isLoading ? (
            <p className="mt-6 text-white/50">{t.common.loading}</p>
          ) : (
            <div className="mt-4">
              <SparkArea points={bookingPoints} />
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl text-[#f7efe8]">{t.pro.revenue14}</h2>
          <p className="mt-1 text-sm text-white/45">{t.pro.revenue14hint}</p>
          {dashboard.isLoading ? (
            <p className="mt-6 text-white/50">{t.common.loading}</p>
          ) : (
            <div className="mt-4">
              <SparkArea points={revenuePoints} color="#c9a27c" />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[#f7efe8]">{t.pro.upcoming}</h2>
          <Link href="/pro/orders" className="text-sm text-[#e8b4a2] hover:underline">
            {t.dashboard.seeAll}
          </Link>
        </div>
        {dashboard.isLoading ? (
          <p className="text-white/50">{t.common.loading}</p>
        ) : (dashboard.data?.upcoming.length ?? 0) === 0 ? (
          <p className="text-white/50">{t.pro.none}</p>
        ) : (
          <ul className="space-y-3">
            {dashboard.data!.upcoming.map((rdv) => (
              <li key={rdv.id}>
                <Link
                  href={`/pro/orders/${rdv.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-[#e8b4a2]/40"
                >
                  <div>
                    <p className="font-medium text-[#f7efe8]">{rdv.customerName}</p>
                    <p className="text-sm text-white/50">
                      {rdv.services.join(', ')} · {formatStatus(rdv.status, t.status)}
                    </p>
                    <p className="text-xs text-white/40">
                      {rdv.scheduledAt
                        ? new Date(rdv.scheduledAt).toLocaleString(intlLocale(locale))
                        : t.common.dateTbd}
                    </p>
                  </div>
                  <p className="text-sm text-[#e8b4a2]">{formatMoney(rdv.totalCents, 'ILS', locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StripeConnectCard />
    </div>
  );
}

function StripeConnectCard() {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const [msg, setMsg] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () =>
      authFetch<{ configured: boolean; onboardingComplete: boolean }>(
        '/api/v1/technicians/me/stripe/status',
      ),
    retry: false,
  });

  const onboard = useMutation({
    mutationFn: () =>
      authFetch<{ url: string }>('/api/v1/technicians/me/stripe/onboard', { method: 'POST' }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      setMsg(t.pro.stripeSim);
    },
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-display text-2xl text-[#f7efe8]">{t.pro.stripeTitle}</h2>
      <p className="mt-2 text-sm text-white/60">
        {t.pro.stripeHint}
        {status.data?.onboardingComplete ? ` ${t.pro.stripeReady}` : ''}
      </p>
      <div className="mt-4">
        <Button variant="gold" disabled={onboard.isPending} onClick={() => onboard.mutate()}>
          {onboard.isPending ? t.pro.stripeRedirect : t.pro.stripeSetup}
        </Button>
      </div>
      {msg ? <p className="mt-3 text-sm text-[#e8b4a2]">{msg}</p> : null}
    </section>
  );
}
