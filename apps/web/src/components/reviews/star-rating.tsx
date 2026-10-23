import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  value,
  size = 'sm',
  className,
}: {
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const px = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span
      className={cn('inline-flex items-center gap-px text-champagne', className)}
      aria-label={`${clamped.toFixed(1)} / 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, clamped - index));
        return (
          <span key={index} className={cn('relative inline-block', px)} aria-hidden>
            <Star className={cn('absolute inset-0 text-ink/15', px)} strokeWidth={1.4} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn('fill-champagne text-champagne', px)} strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
