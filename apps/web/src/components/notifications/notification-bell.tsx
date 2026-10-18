'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { intlLocale } from '@/lib/format';
import { cn } from '@/lib/utils';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({ variant = 'pro' }: { variant?: 'pro' | 'customer' }) {
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isPro = variant === 'pro';

  const unread = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => authFetch<{ unread: number }>('/api/v1/notifications/unread-count'),
    refetchInterval: 30_000,
  });

  const list = useQuery({
    queryKey: ['notifications', 'preview'],
    enabled: open,
    queryFn: () => authFetch<AppNotification[]>('/api/v1/notifications?page=1&limit=8'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const count = unread.data?.unread ?? 0;

  async function openItem(item: AppNotification) {
    if (!item.readAt) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        /* still navigate */
      }
    }
    setOpen(false);
    if (item.href) router.push(item.href);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          isPro ? 'bg-white/10 text-[#f7efe8] hover:bg-white/15' : 'bg-ink/5 text-ink',
        )}
        aria-label={t.nav.notifications}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[10px] font-semibold text-ink">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            'absolute end-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-elevated',
            isPro ? 'border-white/10 bg-[#1a1214] text-[#f7efe8]' : 'border-ink/10 bg-warm-white text-ink',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: isPro ? 'rgba(255,255,255,0.1)' : undefined }}>
            <p className="font-display text-lg">{t.notifications.title}</p>
            <Link
              href="/pro/notifications"
              className={cn('text-xs', isPro ? 'text-[#e8b4a2]' : 'text-champagne')}
              onClick={() => setOpen(false)}
            >
              {t.notifications.seeAll}
            </Link>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {(list.data ?? []).length === 0 ? (
              <li className={cn('px-4 py-6 text-sm', isPro ? 'text-white/50' : 'text-muted')}>
                {t.notifications.empty}
              </li>
            ) : (
              (list.data ?? []).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openItem(item)}
                    className={cn(
                      'w-full px-4 py-3 text-start transition-colors',
                      isPro ? 'hover:bg-white/5' : 'hover:bg-beige/40',
                      !item.readAt && (isPro ? 'bg-[#e8b4a2]/10' : 'bg-champagne/10'),
                    )}
                  >
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {item.title}
                      {!item.readAt ? (
                        <span className="rounded-full bg-champagne px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                          {t.notifications.unread}
                        </span>
                      ) : null}
                    </p>
                    <p className={cn('mt-1 text-xs leading-relaxed', isPro ? 'text-white/60' : 'text-muted')}>
                      {item.body}
                    </p>
                    <p className={cn('mt-1 text-[11px]', isPro ? 'text-white/35' : 'text-muted')}>
                      {new Date(item.createdAt).toLocaleString(intlLocale(locale), {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
