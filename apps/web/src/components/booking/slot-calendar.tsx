'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { availableStartsForMonth, type AvailabilityWindow, ymd } from '@/lib/booking/slots';
import { intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

type Labels = {
  previousMonth: string;
  nextMonth: string;
  today: string;
  noSlots: string;
  loading: string;
  pickSlot: string;
  available: string;
  unavailable: string;
  selected: string;
};

type SlotCalendarProps = {
  value: string;
  onChange: (iso: string) => void;
  availability: AvailabilityWindow[];
  bookedAt: string[];
  locale: string;
  labels: Labels;
  isLoading?: boolean;
};

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function weekdayLabels(locale: string, weekStartsOn: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(2026, 5, 7 + ((i + weekStartsOn) % 7));
    return new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short' }).format(day);
  });
}

export function SlotCalendar({
  value,
  onChange,
  availability,
  bookedAt,
  locale,
  labels,
  isLoading,
}: SlotCalendarProps) {
  const now = new Date();
  const [cursor, setCursor] = useState(() => startOfMonth(now.getFullYear(), now.getMonth()));
  const weekStartsOn = locale === 'he' ? 0 : 1;
  const headers = useMemo(() => weekdayLabels(locale, weekStartsOn), [locale, weekStartsOn]);

  const startsByDay = useMemo(
    () =>
      availableStartsForMonth({
        year: cursor.getFullYear(),
        month: cursor.getMonth(),
        availability,
        bookedAt,
      }),
    [cursor, availability, bookedAt],
  );

  const selectedDate = value ? new Date(value) : null;
  const selectedDay = selectedDate && !Number.isNaN(selectedDate.getTime()) ? ymd(selectedDate) : null;
  const [pickedDay, setPickedDay] = useState<string | null>(selectedDay);

  const visibleDay = pickedDay && startsByDay[pickedDay] ? pickedDay : selectedDay && startsByDay[selectedDay] ? selectedDay : null;
  const daySlots = visibleDay ? startsByDay[visibleDay] ?? [] : [];

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = startOfMonth(year, month);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = lead + daysInMonth;
  const rows = Math.ceil(cells / 7);
  const todayKey = ymd(now);

  const title = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(first);
  const canGoPrev =
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
  const maxMonth = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const canGoNext = cursor < maxMonth;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink/10 bg-beige/20 p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-warm-white text-ink transition-colors hover:border-champagne disabled:opacity-30"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            disabled={!canGoPrev}
            aria-label={labels.previousMonth}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <p className="font-display text-xl capitalize text-ink sm:text-2xl">{title}</p>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-warm-white text-ink transition-colors hover:border-champagne disabled:opacity-30"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            disabled={!canGoNext}
            aria-label={labels.nextMonth}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted sm:text-xs">
          {headers.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: rows * 7 }, (_, index) => {
            const dayNumber = index - lead + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) {
              return <div key={`empty-${index}`} className="h-11" />;
            }
            const date = new Date(year, month, dayNumber);
            const key = ymd(date);
            const slots = startsByDay[key] ?? [];
            const available = slots.length > 0;
            const isToday = key === todayKey;
            const isSelected = key === visibleDay;
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                onClick={() => {
                  setPickedDay(key);
                  if (value && !slots.includes(value)) onChange('');
                }}
                className={cn(
                  'relative flex h-11 items-center justify-center rounded-full text-sm transition-all duration-200',
                  !available && 'cursor-not-allowed text-muted/40',
                  available && !isSelected && 'text-ink hover:bg-champagne/20',
                  isSelected && 'bg-ink text-warm-white shadow-soft',
                  isToday && !isSelected && 'ring-1 ring-champagne',
                )}
              >
                {dayNumber}
                {available && !isSelected ? (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-champagne" />
                ) : null}
              </button>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-champagne" />
            {labels.available}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink/20" />
            {labels.unavailable}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            {labels.selected}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-champagne" />
            {labels.today}
          </li>
        </ul>
      </div>

      <div>
        <p className="text-sm font-medium text-ink">{labels.pickSlot}</p>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted">{labels.loading}</p>
        ) : daySlots.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{labels.noSlots}</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {daySlots.map((iso) => {
              const selected = value === iso;
              const time = new Intl.DateTimeFormat(intlLocale(locale), {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(iso));
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onChange(iso)}
                  className={cn(
                    'min-h-11 rounded-full border text-sm font-medium transition-all duration-200',
                    selected
                      ? 'border-ink bg-ink text-warm-white shadow-soft'
                      : 'border-ink/10 bg-warm-white text-ink hover:border-champagne hover:bg-champagne/10',
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
