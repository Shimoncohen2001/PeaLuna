'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { WigCareHistory } from '@/components/care/wig-care-history';

export default function CustomerWigDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const overview = useQuery({
    queryKey: ['wig-care', params.id],
    queryFn: () => authFetch(`/api/v1/wigs/${params.id}/care-history`),
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/wigs" className="text-sm text-champagne hover:underline">
        <span className="inline-block rtl:rotate-180">←</span> {t.wigs.title}
      </Link>
      {overview.isLoading ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : overview.data ? (
        <WigCareHistory data={overview.data as never} variant="customer" />
      ) : (
        <p className="text-muted">{t.payment.notFound}</p>
      )}
    </div>
  );
}
