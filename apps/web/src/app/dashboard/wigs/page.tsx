'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WigDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export default function WigsPage() {
  const { authFetch } = useAuth();
  const { t, format } = useLocale();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const wigs = useQuery({
    queryKey: ['wigs'],
    queryFn: () => authFetch<WigDto[]>('/api/v1/wigs'),
  });

  const createWig = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch<WigDto>('/api/v1/wigs', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setOpen(false);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['wigs'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.wigs.createFailed);
    },
  });

  const deleteWig = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/v1/wigs/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['wigs'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.wigs.deleteFailed);
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const lengthRaw = String(form.get('lengthCm') || '');
    createWig.mutate({
      name: String(form.get('name')),
      brand: String(form.get('brand') || '') || undefined,
      color: String(form.get('color') || '') || undefined,
      fiberType: String(form.get('fiberType') || '') || undefined,
      lengthCm: lengthRaw ? Number(lengthRaw) : undefined,
      conditionNotes: String(form.get('conditionNotes') || '') || undefined,
    });
  }

  async function onDelete(wig: WigDto) {
    const ok = await confirm({
      title: t.common.confirmTitle,
      description: t.wigs.deleteConfirm,
      confirmLabel: t.common.delete,
      variant: 'primary',
    });
    if (!ok) return;
    deleteWig.mutate(wig.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{t.wigs.title}</h1>
          <p className="mt-2 text-muted">{t.wigs.subtitle}</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto" onClick={() => setOpen((v) => !v)}>
          {open ? t.common.cancel : t.wigs.add}
        </Button>
      </div>

      {open ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                {t.wigs.name}
              </label>
              <input id="name" name="name" required className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="brand">
                {t.wigs.brand}
              </label>
              <input id="brand" name="brand" className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="color">
                {t.wigs.color}
              </label>
              <input id="color" name="color" className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="fiberType">
                {t.wigs.fiber}
              </label>
              <input id="fiberType" name="fiberType" className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="lengthCm">
                {t.wigs.length}
              </label>
              <input
                id="lengthCm"
                name="lengthCm"
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="conditionNotes">
              {t.wigs.condition}
            </label>
            <textarea
              id="conditionNotes"
              name="conditionNotes"
              rows={3}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" variant="gold" disabled={createWig.isPending}>
            {createWig.isPending ? '…' : t.common.save}
          </Button>
        </form>
      ) : null}

      {error && !open ? <p className="text-sm text-red-700">{error}</p> : null}

      {wigs.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : (wigs.data?.length ?? 0) === 0 ? (
        <p className="text-muted">{t.wigs.empty}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {wigs.data!.map((wig) => (
            <li
              key={wig.id}
              className="flex flex-col justify-between rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5"
            >
              <div>
                <Link href={`/dashboard/wigs/${wig.id}`}>
                  <h2 className="font-display text-2xl text-ink hover:text-champagne">{wig.name}</h2>
                </Link>
                {wig.reference ? <p className="text-xs text-muted">{wig.reference}</p> : null}
                <p className="mt-1 text-sm text-muted">
                  {[wig.brand, wig.color, wig.fiberType].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {wig.currentWeightGrams != null ? `${wig.currentWeightGrams} g · ` : ''}
                  {wig.lastTechnicianName
                    ? `${t.wigs.lastExpert} : ${wig.lastTechnicianName}`
                    : format(t.wigs.mediaCount, { n: wig.attachmentCount ?? 0 })}
                </p>
                <Link href={`/dashboard/wigs/${wig.id}`} className="mt-2 inline-block text-sm text-champagne hover:underline">
                  {t.wigs.viewState}
                </Link>
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={deleteWig.isPending}
                  onClick={() => onDelete(wig)}
                >
                  {t.common.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
