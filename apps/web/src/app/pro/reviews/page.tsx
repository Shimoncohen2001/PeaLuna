'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ReviewDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export default function ProReviewsPage() {
  const { authFetch, user } = useAuth();
  const { t, locale } = useLocale();
  const isTech = user?.roles?.includes('TECHNICIAN');
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'fr' ? 'fr-FR' : 'en-GB';

  const reviews = useQuery({
    queryKey: ['pro-reviews'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<ReviewDto[]>('/api/v1/technicians/me/reviews?limit=50'),
    retry: false,
  });

  if (!isTech) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl text-[#e8b4a2]">{t.review.proTitle}</h1>
        <Link href="/pro/apply">
          <Button variant="gold">{t.home.ctaBecomeExpert}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#e8b4a2]">{t.brand}</p>
        <h1 className="font-display text-4xl text-[#f7efe8]">{t.review.proTitle}</h1>
        <p className="mt-2 text-white/60">{t.review.proSubtitle}</p>
      </div>

      {reviews.isLoading ? (
        <p className="text-white/50">{t.common.loading}</p>
      ) : (reviews.data?.length ?? 0) === 0 ? (
        <p className="text-white/50">{t.review.proEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.data!.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-[#f7efe8]">
                  {review.customerName ?? 'Client'}
                </p>
                <p className="text-[#e8b4a2]">{'★'.repeat(review.rating)}</p>
              </div>
              {review.comment ? (
                <p className="mt-3 text-sm text-white/70 whitespace-pre-wrap">{review.comment}</p>
              ) : null}
              <p className="mt-3 text-xs text-white/40">
                {review.orderNumber ? `${review.orderNumber} · ` : ''}
                {new Date(review.createdAt).toLocaleString(dateLocale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
