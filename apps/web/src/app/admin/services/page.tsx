'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ServiceTypeDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney } from '@/lib/format';

const EMPTY_SERVICE = {
  name: '',
  category: '',
  description: '',
  basePriceCents: 15_000,
  estimatedMinutes: 60,
  isActive: true,
};

export default function AdminServicesPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<ServiceTypeDto> | null>(null);

  const services = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => authFetch<ServiceTypeDto[]>('/api/v1/admin/services?limit=100'),
  });

  const save = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      payload.id
        ? authFetch(`/api/v1/admin/services/${payload.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload.body),
          })
        : authFetch('/api/v1/admin/services', {
            method: 'POST',
            body: JSON.stringify(payload.body),
          }),
    onSuccess: async () => {
      setEditing(null);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => authFetch(`/api/v1/admin/services/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (name.length < 2) {
      setError(t.admin.nameHint);
      return;
    }
    const shekels = Number(form.get('priceIls') || 0);
    save.mutate({
      id: editing?.id,
      body: {
        name,
        description: String(form.get('description') || '') || undefined,
        category: String(form.get('category') || '') || undefined,
        basePriceCents: Math.round(shekels * 100),
        currency: 'ILS',
        estimatedMinutes: Number(form.get('minutes') || 60),
        isActive: form.get('isActive') === 'on',
      },
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.admin.services}</h1>
          <p className="mt-2 text-muted">{t.admin.nameHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/skills" className="text-sm text-champagne hover:underline">
            {t.admin.skills}
          </Link>
          <Link href="/admin/workflow" className="text-sm text-champagne hover:underline">
            {t.admin.workflow}
          </Link>
          <Button variant="primary" onClick={() => setEditing(EMPTY_SERVICE)}>
            {t.admin.add}
          </Button>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t.admin.name}</label>
              <input
                name="name"
                required
                minLength={2}
                maxLength={150}
                defaultValue={editing.name ?? ''}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.admin.category}</label>
              <input
                name="category"
                defaultValue={editing.category ?? ''}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.admin.priceIls}</label>
              <input
                name="priceIls"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={editing.basePriceCents != null ? editing.basePriceCents / 100 : 150}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.admin.minutes}</label>
              <input
                name="minutes"
                type="number"
                min={5}
                defaultValue={editing.estimatedMinutes ?? 60}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.review.commentLabel}</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing.description ?? ''}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={editing.isActive !== false} />
            {t.common.active}
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit" variant="gold" disabled={save.isPending}>
              {t.common.save}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {services.data?.map((service) => (
          <li key={service.id} className="rounded-xl border border-ink/5 bg-warm-white p-5">
            <p className="text-xs uppercase tracking-wide text-champagne">
              {service.category ?? '—'}
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">{service.name}</h2>
            <p className="mt-2 text-sm text-muted">{service.description}</p>
            <p className="mt-3 font-medium text-ink">
              {formatMoney(service.basePriceCents, service.currency, locale)}
            </p>
            {service.isActive === false ? (
              <p className="mt-1 text-xs text-muted">{t.admin.hidden}</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(service)}>
                {t.common.edit}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!window.confirm(t.admin.deleteConfirm)) return;
                  remove.mutate(service.id);
                }}
                disabled={remove.isPending}
              >
                {t.common.delete}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
