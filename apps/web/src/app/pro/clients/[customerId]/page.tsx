'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { careLabel, careUi } from '@/lib/i18n/care';
import { useLocale } from '@/lib/i18n/locale';

type WigRow = {
  id: string;
  reference: string;
  name: string;
  currentCondition: string | null;
  currentWeightGrams: number | null;
  lastCareAt: string | null;
  lastTechnicianName: string | null;
};

export default function ProClientWigsPage() {
  const params = useParams<{ customerId: string }>();
  const { authFetch } = useAuth();
  const { locale, t } = useLocale();
  const ui = careUi(locale);
  const wigs = useQuery({
    queryKey: ['pro-client-wigs', params.customerId],
    queryFn: () =>
      authFetch<WigRow[]>(`/api/v1/technicians/me/clients/${params.customerId}/wigs`),
  });

  return (
    <div className="space-y-6">
      <Link href="/pro/clients" className="text-sm text-[#e8b4a2] hover:underline">
        <span className="inline-block rtl:rotate-180">←</span> {t.nav.clients}
      </Link>
      <h1 className="font-display text-4xl text-[#f7efe8]">{t.dashboard.wigs}</h1>
      {wigs.isLoading ? (
        <p className="text-white/50">{t.common.loading}</p>
      ) : (
        <ul className="space-y-3">
          {wigs.data?.map((w) => (
            <li key={w.id}>
              <Link
                href={`/pro/wigs/${w.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-4 hover:border-[#e8b4a2]/40"
              >
                <p className="font-medium text-[#f7efe8]">
                  {w.name} · {w.reference}
                </p>
                <p className="text-sm text-white/50">
                  {w.currentCondition ? careLabel(locale, w.currentCondition) : ui.noCareYet}
                  {w.currentWeightGrams != null ? ` · ${w.currentWeightGrams} g` : ''}
                  {w.lastTechnicianName ? ` · ${w.lastTechnicianName}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
