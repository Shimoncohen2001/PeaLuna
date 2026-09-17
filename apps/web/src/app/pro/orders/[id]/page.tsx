'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { calculatePlatformCommissionCents } from '@velure/domain';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import { BookingStatusTracker } from '@/components/booking/booking-status-tracker';

type JobMedia = {
  id: string;
  mimeType: string;
  purpose: string;
  kind: 'image' | 'video';
  url: string | null;
  createdAt: string;
};

type JobDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalCents: number;
  paymentStatus: string;
  paymentMethod: 'CARD' | 'CASH';
  cashConfirmedAt: string | null;
  canConfirmCash: boolean;
  venueType: 'HOME' | 'SALON' | null;
  scheduledAt: string | null;
  serviceAddressLine: string | null;
  serviceCity: string | null;
  servicePostalCode: string | null;
  customerNotes: string | null;
  canComplete: boolean;
  canRespond: boolean;
  wig: {
    id: string;
    name: string;
    brand: string | null;
    color: string | null;
    fiberType: string | null;
    conditionNotes: string | null;
    reference?: string;
  };
  customer: { name: string; email: string; phone: string | null };
  services: { id: string; name: string; lineTotalCents: number }[];
  media?: JobMedia[];
};

export default function ProOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const { t, locale, format } = useLocale();
  const confirm = useConfirm();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [cashNote, setCashNote] = useState<string | null>(null);
  const [careDone, setCareDone] = useState(false);
  const cashKeyRef = useRef(crypto.randomUUID());
  const cashSectionRef = useRef<HTMLDivElement | null>(null);
  const cashGuard = useRef(false);
  const isTech = user?.roles?.includes('TECHNICIAN');
  const dateLocale = intlLocale(locale);

  const job = useQuery({
    queryKey: ['pro-order', params.id],
    enabled: Boolean(isTech && params.id),
    queryFn: () => authFetch<JobDetail>(`/api/v1/technicians/me/orders/${params.id}`),
    retry: false,
  });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const fromCare = query.get('done') === 'care';
    const highlightCash = query.get('next') === 'cash';
    if (fromCare) setCareDone(true);
    if (highlightCash) {
      window.setTimeout(() => {
        cashSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
    if (fromCare || highlightCash) {
      const url = new URL(window.location.href);
      url.searchParams.delete('done');
      url.searchParams.delete('next');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pro-order', params.id] });
    await queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
    await queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
  };

  const respond = useMutation({
    mutationFn: (decision: 'accept' | 'decline') =>
      authFetch(`/api/v1/technicians/me/orders/${params.id}/${decision}`, { method: 'POST' }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.auth.error);
    },
  });

  const confirmCash = useMutation({
    mutationFn: async () => {
      try {
        return await authFetch<{ commissionDueCents: number; currency: string }>(
          `/api/v1/technicians/me/orders/${params.id}/payments/cash-received`,
          { method: 'POST', headers: { 'Idempotency-Key': cashKeyRef.current } },
        );
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          (err.code === 'CASH_ALREADY_CONFIRMED' || err.code === 'ALREADY_PAID')
        ) {
          return {
            commissionDueCents: calculatePlatformCommissionCents(job.data?.totalCents ?? 0),
            currency: job.data?.currency ?? 'ILS',
          };
        }
        throw err;
      }
    },
    onSuccess: async (result) => {
      cashGuard.current = false;
      setError(null);
      setCashNote(
        `${t.cash.expertConfirmed} ${format(t.cash.expertDue, {
          amount: formatMoney(result.commissionDueCents, result.currency, locale),
        })}`,
      );
      await invalidate();
      window.setTimeout(() => {
        router.replace('/pro');
      }, 1600);
    },
    onError: (err) => {
      cashGuard.current = false;
      setError(err instanceof ApiClientError ? err.message : t.cash.failed);
    },
  });

  if (!isTech) {
    return <p className="text-white/60">{t.common.requiredProfile}</p>;
  }

  if (job.isLoading) {
    return <p className="text-white/50">{t.common.loading}</p>;
  }

  if (!job.data) {
    return <p className="text-white/50">{t.payment.notFound}</p>;
  }

  const data = job.data;
  const address = [data.serviceAddressLine, data.servicePostalCode, data.serviceCity]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pro/orders" className="text-sm text-[#e8b4a2] hover:underline">
          <span className="inline-block rtl:rotate-180">←</span> {t.nav.proOrders}
        </Link>
        <p className="mt-3 text-sm uppercase tracking-[0.15em] text-[#e8b4a2]">
          {formatStatus(data.status, t.status)}
        </p>
        <h1 className="font-display text-4xl text-[#f7efe8]">{t.job.title}</h1>
        <p className="mt-1 text-white/50">{data.orderNumber}</p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {careDone ? (
        <p className="rounded-xl border border-[#e8b4a2]/40 bg-[#e8b4a2]/10 px-4 py-3 text-sm text-[#f7efe8]">
          {t.pro.careDoneBanner}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <BookingStatusTracker status={data.status} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl text-[#f7efe8]">{t.job.customer}</h2>
        <p className="mt-2 text-[#f7efe8]">{data.customer.name}</p>
        <p className="text-sm text-white/50">{data.customer.email}</p>
        {data.customer.phone ? <p className="text-sm text-white/50">{data.customer.phone}</p> : null}
        {data.scheduledAt ? (
          <p className="mt-3 text-sm text-white/70">
            {t.payment.appointment} : {new Date(data.scheduledAt).toLocaleString(dateLocale)}
            {data.venueType
              ? ` · ${data.venueType === 'HOME' ? t.payment.homeVenue : t.payment.salonVenue}`
              : ''}
          </p>
        ) : null}
        {address ? (
          <p className="mt-1 text-sm text-white/70">
            {t.job.address} : {address}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl text-[#f7efe8]">{t.job.wig}</h2>
        <p className="mt-2 text-[#f7efe8]">{data.wig.name}</p>
        <p className="text-sm text-white/50">
          {[data.wig.brand, data.wig.color, data.wig.fiberType].filter(Boolean).join(' · ') || '—'}
        </p>
        {data.wig.conditionNotes ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{data.wig.conditionNotes}</p>
        ) : null}
        <Link href={`/pro/wigs/${data.wig.id}`} className="mt-3 inline-block text-sm text-[#e8b4a2] hover:underline">
          {t.pro.wigHistory}
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl text-[#f7efe8]">{t.payment.services}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.services.map((s) => (
            <li key={s.id} className="flex justify-between text-white/70">
              <span>{s.name}</span>
              <span className="text-[#e8b4a2]">{formatMoney(s.lineTotalCents, data.currency, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-medium text-[#f7efe8]">
          <span>{t.common.total}</span>
          <span>{formatMoney(data.totalCents, data.currency, locale)}</span>
        </div>

        {data.paymentMethod === 'CASH' ? (
          <div
            ref={cashSectionRef}
            id="cash-settle"
            className="mt-4 space-y-3 rounded-lg border border-[#e8b4a2]/30 bg-[#e8b4a2]/5 p-4"
          >
            {data.cashConfirmedAt ? (
              <p className="text-sm text-[#f7efe8]">{t.cash.expertConfirmed}</p>
            ) : (
              <p className="text-sm text-[#f7efe8]">{t.cash.expertPending}</p>
            )}
            <p className="text-sm text-white/60">
              {format(t.cash.expertDue, {
                amount: formatMoney(
                  calculatePlatformCommissionCents(data.totalCents),
                  data.currency,
                  locale,
                ),
              })}
            </p>
            {data.canConfirmCash ? (
              <>
                <p className="text-xs text-white/50">{t.cash.expertConfirmPrompt}</p>
                <Button
                  variant="gold"
                  className="w-full sm:w-auto"
                  disabled={confirmCash.isPending || Boolean(cashNote)}
                  onClick={async () => {
                    if (cashGuard.current || confirmCash.isPending) return;
                    const ok = await confirm({
                      title: t.cash.expertConfirm,
                      description: t.cash.expertConfirmPrompt,
                      confirmLabel: t.cash.expertConfirm,
                      variant: 'gold',
                    });
                    if (!ok) return;
                    cashGuard.current = true;
                    confirmCash.mutate();
                  }}
                >
                  {confirmCash.isPending ? t.cash.expertConfirming : t.cash.expertConfirm}
                </Button>
              </>
            ) : null}
            {cashNote ? (
              <>
                <p className="text-sm text-[#e8b4a2]">{cashNote}</p>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.replace('/pro')}>
                  {t.pro.backToDashboard}
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl text-[#f7efe8]">{t.job.photos}</h2>
        {(data.media ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-white/50">{t.job.noPhotos}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(data.media ?? []).map((item) => (
              <li key={item.id} className="overflow-hidden rounded-lg border border-white/10">
                {item.url && item.kind === 'video' ? (
                  <video src={item.url} className="h-36 w-full object-cover" controls />
                ) : item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <img src={item.url} alt="" className="h-36 w-full object-cover" />
                  </a>
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-white/40">
                    {item.mimeType}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.customerNotes ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-2xl text-[#f7efe8]">{t.payment.notes}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{data.customerNotes}</p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {data.canRespond ? (
          <>
            <Button
              variant="gold"
              disabled={respond.isPending}
              onClick={() => respond.mutate('accept')}
            >
              {t.job.accept}
            </Button>
            <Button
              variant="secondary"
              disabled={respond.isPending}
              onClick={() => respond.mutate('decline')}
            >
              {t.job.decline}
            </Button>
          </>
        ) : null}
        {data.canComplete ? (
          <Link href={`/pro/orders/${data.id}/care`}>
            <Button variant="gold">{t.pro.finishCare}</Button>
          </Link>
        ) : null}
        {data.status === 'COMPLETED' ? (
          <>
            <Link href={`/pro/orders/${data.id}/care`} className="text-sm text-[#e8b4a2] hover:underline">
              {t.pro.viewCareSheet}
            </Link>
            {!data.canConfirmCash ? (
              <Link href="/pro" className="text-sm text-[#e8b4a2] hover:underline">
                {t.pro.backToDashboard}
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
