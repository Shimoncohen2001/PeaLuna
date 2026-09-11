'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

type Slot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type TechMe = {
  availability: Slot[];
};

export default function ProAvailabilityPage() {
  const { authFetch, user } = useAuth();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isTech = user?.roles?.includes('TECHNICIAN');
  const DAYS = [
    { value: 1, label: t.pro.weekdays[1] },
    { value: 2, label: t.pro.weekdays[2] },
    { value: 3, label: t.pro.weekdays[3] },
    { value: 4, label: t.pro.weekdays[4] },
    { value: 5, label: t.pro.weekdays[5] },
    { value: 6, label: t.pro.weekdays[6] },
    { value: 0, label: t.pro.weekdays[0] },
  ];

  const mine = useQuery({
    queryKey: ['tech-me'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<TechMe>('/api/v1/technicians/me'),
  });

  useEffect(() => {
    if (mine.data?.availability) {
      setSlots(
        mine.data.availability.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: true,
        })),
      );
    }
  }, [mine.data]);

  const save = useMutation({
    mutationFn: (payload: Slot[]) =>
      authFetch('/api/v1/technicians/me/availability', {
        method: 'PUT',
        body: JSON.stringify({ slots: payload }),
      }),
    onSuccess: async () => {
      setMessage(t.pro.availabilitySaved);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['tech-me'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.pro.saveFailed);
    },
  });

  function toggleDay(dayOfWeek: number) {
    setSlots((prev) => {
      const exists = prev.find((s) => s.dayOfWeek === dayOfWeek);
      if (exists) return prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      return [...prev, { dayOfWeek, startTime: '10:00', endTime: '18:00', isActive: true }];
    });
  }

  function updateTime(dayOfWeek: number, field: 'startTime' | 'endTime', value: string) {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s)),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate(slots);
  }

  if (!isTech) {
    return <p className="text-white/60">{t.common.requiredProfile}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[#e8b4a2]">{t.pro.availabilityTitle}</h1>
        <p className="mt-2 text-white/60">{t.pro.availabilityHint}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        {DAYS.map((day) => {
          const slot = slots.find((s) => s.dayOfWeek === day.value);
          const active = Boolean(slot);
          return (
            <div
              key={day.value}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 px-4 py-3"
            >
              <label className="flex w-28 items-center gap-2 text-sm text-[#f7efe8]">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleDay(day.value)}
                />
                {day.label}
              </label>
              {active && slot ? (
                <>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTime(day.value, 'startTime', e.target.value)}
                    className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm"
                  />
                  <span className="text-white/40">→</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTime(day.value, 'endTime', e.target.value)}
                    className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm"
                  />
                </>
              ) : (
                <span className="text-sm text-white/40">{t.pro.closed}</span>
              )}
            </div>
          );
        })}

        {message ? <p className="text-sm text-[#e8b4a2]">{message}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <Button type="submit" variant="gold" disabled={save.isPending}>
          {save.isPending ? t.job.completing : t.common.save}
        </Button>
      </form>
    </div>
  );
}
