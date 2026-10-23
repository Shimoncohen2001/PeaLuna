'use client';

import { useQuery } from '@tanstack/react-query';
import type { PublicReviewDto } from '@velure/contracts';
import { StarRating } from '@/components/reviews/star-rating';
import { useAuth } from '@/lib/auth';
import { intlLocale } from '@/lib/format';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export function RatingSummary({
  ratingAvg,
  reviewCount,
  className,
}: {
  ratingAvg: number;
  reviewCount: number;
  className?: string;
}) {
  const { t, format } = useLocale();

  if (reviewCount <= 0) {
    return <p className={cn('text-sm text-muted', className)}>{t.review.newOnPealuna}</p>;
  }

  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink', className)}>
      <StarRating value={ratingAvg} />
      <span className="tabular-nums text-ink">{ratingAvg.toFixed(1)}</span>
      <span className="text-muted">
        {reviewCount === 1 ? t.review.countOne : format(t.review.count, { n: reviewCount })}
      </span>
    </p>
  );
}

export function ReviewQuote({
  comment,
  customerName,
  className,
}: {
  comment: string;
  customerName: string;
  className?: string;
}) {
  return (
    <figure className={cn('text-sm text-muted', className)}>
      <blockquote className="line-clamp-2 italic leading-relaxed">“{comment}”</blockquote>
      <figcaption className="mt-1 text-xs tracking-wide text-muted/90">{customerName}</figcaption>
    </figure>
  );
}

export function ExpertReviewList({
  technicianId,
  enabled,
}: {
  technicianId: string;
  enabled: boolean;
}) {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const dateLocale = intlLocale(locale);

  const reviews = useQuery({
    queryKey: ['public-expert-reviews', technicianId],
    enabled,
    queryFn: () =>
      authFetch<PublicReviewDto[]>(`/api/v1/technicians/${technicianId}/reviews?limit=8`),
  });

  if (!enabled) return null;
  if (reviews.isLoading) {
    return <p className="mt-3 text-xs text-muted">{t.common.loading}</p>;
  }
  if (!reviews.data?.length) return null;

  const withComment = reviews.data.filter((row) => row.comment);
  const rows = withComment.length > 0 ? withComment : reviews.data;

  return (
    <ul className="mt-3 space-y-3 border-t border-ink/5 pt-3">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="flex items-center gap-2">
            <StarRating value={row.rating} />
            <span className="text-xs text-muted">{row.customerName}</span>
            <span className="text-xs text-muted/70">
              {new Date(row.createdAt).toLocaleDateString(dateLocale, {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {row.comment ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">“{row.comment}”</p>
          ) : (
            <p className="mt-1 text-xs text-muted">{t.review.ratingOnly}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
