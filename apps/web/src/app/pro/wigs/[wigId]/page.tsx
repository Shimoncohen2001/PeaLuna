'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { WigCareHistory } from '@/components/care/wig-care-history';
import { careUi } from '@/lib/i18n/care';
import { useLocale } from '@/lib/i18n/locale';

export default function ProWigHistoryPage() {
  const params = useParams<{ wigId: string }>();
  const { authFetch } = useAuth();
  const { locale, t } = useLocale();
  const ui = careUi(locale);
  const overview = useQuery({
    queryKey: ['pro-wig', params.wigId],
    queryFn: () => authFetch(`/api/v1/technicians/me/wigs/${params.wigId}`),
  });

  return (
    <div className="space-y-6">
      <Link href="/pro/clients" className="text-sm text-[#e8b4a2] hover:underline">
        <span className="inline-block rtl:rotate-180">←</span> {t.nav.clients}
      </Link>
      {overview.isLoading ? (
        <p className="text-white/50">{t.common.loading}</p>
      ) : overview.data ? (
        <WigCareHistory data={overview.data as never} variant="pro" />
      ) : (
        <p className="text-white/50">{ui.notFoundWig}</p>
      )}
    </div>
  );
}
