'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CareReportForm } from '@/components/care/care-report-form';
import { careUi } from '@/lib/i18n/care';
import { useLocale } from '@/lib/i18n/locale';

export default function CareReportPage() {
  const params = useParams<{ id: string }>();
  const { locale } = useLocale();
  const ui = careUi(locale);
  return (
    <div className="space-y-6">
      <Link href={`/pro/orders/${params.id}`} className="text-sm text-[#e8b4a2] hover:underline">
        <span className="inline-block rtl:rotate-180">←</span> {ui.backToJob}
      </Link>
      <CareReportForm orderId={params.id} />
    </div>
  );
}
