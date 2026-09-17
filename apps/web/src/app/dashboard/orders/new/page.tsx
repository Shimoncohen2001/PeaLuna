'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { OrderDto, ServiceTypeDto, WigDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { formatMoney } from '@/lib/format';
import { useLocale } from '@/lib/i18n/locale';
import { catalogServiceDescription, catalogServiceName } from '@/lib/i18n/catalog';

export default function NewOrderPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wigs = useQuery({
    queryKey: ['wigs'],
    queryFn: () => authFetch<WigDto[]>('/api/v1/wigs'),
  });

  const services = useQuery({
    queryKey: ['services'],
    queryFn: () => authFetch<ServiceTypeDto[]>('/api/v1/services'),
  });

  const totalCents = useMemo(() => {
    if (!services.data) return 0;
    return services.data
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.basePriceCents, 0);
  }, [services.data, selectedServices]);

  const createOrder = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch<OrderDto>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (order) => {
      router.push(`/dashboard/orders/${order.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.book.bookFailed);
    },
  });

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    if (selectedServices.length === 0) {
      setError(t.book.needService);
      return;
    }
    createOrder.mutate({
      wigId: String(form.get('wigId')),
      serviceTypeIds: selectedServices,
      customerNotes: String(form.get('customerNotes') || '') || undefined,
      submit: form.get('submitNow') === 'on',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">{t.book.title}</h1>
        <p className="mt-2 text-muted">{t.book.subtitle}</p>
      </div>

      {(wigs.data?.length ?? 0) === 0 && !wigs.isLoading ? (
        <p className="text-muted">
          {t.book.pickWigFirst}{' '}
          <Link href="/dashboard/wigs" className="text-champagne hover:underline">
            {t.book.addWigLink}
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="wigId" className="text-sm font-medium">
              {t.book.stepWig}
            </label>
            <select
              id="wigId"
              name="wigId"
              required
              className="mt-1 w-full rounded-lg border border-ink/10 bg-warm-white px-3 py-2"
            >
              <option value="">{t.book.choosePlaceholder}</option>
              {wigs.data?.map((wig) => (
                <option key={wig.id} value={wig.id}>
                  {wig.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">{t.book.stepServices}</legend>
            <ul className="mt-3 space-y-2">
              {services.data?.map((service) => {
                const checked = selectedServices.includes(service.id);
                return (
                  <li key={service.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/5 bg-warm-white p-4 hover:border-champagne/40">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(service.id)}
                        className="mt-1"
                      />
                      <span className="flex-1">
                        <span className="block font-medium text-ink">
                          {catalogServiceName(locale, service.slug, service.name)}
                        </span>
                        <span className="block text-sm text-muted">
                          {catalogServiceDescription(locale, service.slug, service.description)}
                        </span>
                      </span>
                      <span className="text-sm text-ink">
                        {formatMoney(service.basePriceCents, service.currency, locale)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div>
            <label htmlFor="customerNotes" className="text-sm font-medium">
              {t.payment.notes}
            </label>
            <textarea
              id="customerNotes"
              name="customerNotes"
              rows={3}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              placeholder={t.book.addressPlaceholder}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="submitNow" type="checkbox" defaultChecked />
            {t.book.stepConfirm}
          </label>

          <div className="flex items-center justify-between rounded-xl border border-ink/5 bg-warm-white px-4 py-3">
            <span className="text-sm text-muted">{t.common.total}</span>
            <span className="font-medium text-ink">{formatMoney(totalCents, 'ILS', locale)}</span>
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <Button type="submit" variant="primary" disabled={createOrder.isPending}>
            {createOrder.isPending ? t.auth.creating : t.book.stepConfirm}
          </Button>
        </form>
      )}
    </div>
  );
}
