'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TechnicianStatusDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatStatus } from '@/lib/format';

type AdminTechnician = {
  id: string;
  status: TechnicianStatusDto;
  displayName: string;
  email: string;
  serviceCity: string | null;
  servicePostalCode: string | null;
  yearsExperience: number | null;
  createdAt: string;
  services: string[];
};

const FILTERS = [
  { id: 'all' as const, key: 'all' as const },
  { id: 'UNDER_REVIEW' as const, key: 'review' as const },
  { id: 'APPROVED' as const, key: 'approved' as const },
  { id: 'REJECTED' as const, key: 'rejected' as const },
];

export default function AdminTechniciansPage() {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | TechnicianStatusDto>('UNDER_REVIEW');
  const [error, setError] = useState<string | null>(null);
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'fr' ? 'fr-FR' : 'en-GB';

  const technicians = useQuery({
    queryKey: ['admin-technicians', status],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (status !== 'all') params.set('status', status);
      return authFetch<AdminTechnician[]>(`/api/v1/admin/technicians?${params}`);
    },
  });

  const decide = useMutation({
    mutationFn: (payload: { id: string; action: 'approve' | 'reject' }) =>
      authFetch(`/api/v1/admin/technicians/${payload.id}/${payload.action}`, { method: 'POST' }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-technicians'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.admin.expertsTitle}</h1>
          <p className="mt-2 text-muted">{t.admin.expertsSubtitle}</p>
        </div>
        <Link href="/admin/services" className="text-sm text-champagne hover:underline">
          {t.admin.services}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatus(filter.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              status === filter.id ? 'bg-ink text-warm-white' : 'border border-ink/10 text-muted'
            }`}
          >
            {t.admin.filters[filter.key]}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {technicians.isLoading ? <p className="text-muted">{t.common.loading}</p> : null}
      {technicians.data?.length === 0 ? <p className="text-muted">{t.admin.noExperts}</p> : null}

      <ul className="space-y-4">
        {technicians.data?.map((expert) => (
          <li
            key={expert.id}
            className="flex flex-col gap-4 rounded-xl border border-ink/5 bg-warm-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-ink">{expert.displayName}</p>
              <p className="text-sm text-muted">{expert.email}</p>
              <p className="mt-1 text-sm text-muted">
                {[expert.serviceCity, expert.servicePostalCode].filter(Boolean).join(' · ') || '—'}
                {expert.yearsExperience != null ? ` · ${expert.yearsExperience}y` : ''}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatStatus(expert.status)} · {new Date(expert.createdAt).toLocaleDateString(dateLocale)}
              </p>
              {expert.services.length > 0 ? (
                <p className="mt-1 text-xs text-muted">{expert.services.join(' · ')}</p>
              ) : null}
            </div>
            {expert.status === 'UNDER_REVIEW' || expert.status === 'PENDING_APPLICATION' ? (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: expert.id, action: 'approve' })}
                >
                  {t.admin.approve}
                </Button>
                <Button
                  variant="secondary"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: expert.id, action: 'reject' })}
                >
                  {t.admin.reject}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
