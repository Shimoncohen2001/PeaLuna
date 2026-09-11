'use client';

import { bookingTrackerState } from '@velure/domain';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

const STEP_KEYS = ['sent', 'accepted', 'inProgress', 'completed'] as const;

export function BookingStatusTracker({
  status,
  lastAction,
  className,
}: {
  status: string;
  lastAction?: string | null;
  className?: string;
}) {
  const { t, dir } = useLocale();
  const state = bookingTrackerState(status, lastAction);

  if (state.kind === 'cancelled' || state.kind === 'rejected') {
    return (
      <p className={cn('rounded-xl border border-ink/10 bg-warm-white px-4 py-3 text-sm text-ink', className)}>
        {state.kind === 'rejected' ? t.tracker.rejected : t.tracker.cancelled}
      </p>
    );
  }

  const current = state.step;

  return (
    <ol
      className={cn('flex flex-col gap-0', className)}
      dir={dir}
      aria-label={t.orders.subtitle}
    >
      {STEP_KEYS.map((key, index) => {
        const done = index < current;
        const active = index === current;
        const pending = index > current;
        return (
          <li key={key} className="flex gap-3">
            <div className="flex w-6 flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  done && 'bg-ink text-warm-white',
                  active && 'bg-champagne text-ink',
                  pending && 'border border-ink/20 bg-warm-white text-muted',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? '✓' : active ? '●' : '○'}
              </span>
              {index < STEP_KEYS.length - 1 ? (
                <span className="my-1 w-px flex-1 min-h-4 bg-ink/15" aria-hidden />
              ) : null}
            </div>
            <p
              className={cn(
                'pb-4 pt-0.5 text-sm',
                active ? 'font-medium text-ink' : done ? 'text-ink' : 'text-muted',
              )}
            >
              {t.tracker[key]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
