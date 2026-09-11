'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export function ReviewModal({
  open,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; comment?: string }) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const { t } = useLocale();
  const titleId = useId();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      rating,
      comment: comment.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.review.later}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-ink/5 bg-warm-white p-6 shadow-elevated"
      >
        <p className="text-sm uppercase tracking-[0.18em] text-champagne">{t.brand}</p>
        <h2 id={titleId} className="mt-2 font-display text-3xl text-ink">
          {t.review.title}
        </h2>
        <p className="mt-2 text-sm text-muted">{t.review.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{t.review.ratingLabel}</p>
            <div className="flex gap-2" role="radiogroup" aria-label={t.review.ratingLabel}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  onClick={() => setRating(value)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border text-lg transition',
                    rating >= value
                      ? 'border-champagne bg-champagne/20 text-ink'
                      : 'border-ink/10 text-muted hover:border-champagne/40',
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink" htmlFor="review-comment">
              {t.review.commentLabel}
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.review.commentPlaceholder}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-champagne"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? t.review.submitting : t.review.submit}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t.review.later}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
