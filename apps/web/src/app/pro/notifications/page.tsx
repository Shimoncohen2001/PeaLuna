'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { intlLocale } from '@/lib/format';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/components/notifications/notification-bell';

export default function ProNotificationsPage() {
  const { authFetch, user } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isTech = user?.roles?.includes('TECHNICIAN');

  const list = useQuery({
    queryKey: ['notifications', 'all'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<AppNotification[]>('/api/v1/notifications?page=1&limit=50'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => authFetch('/api/v1/notifications/read-all', { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  if (!isTech) {
    return <p className="text-white/60">{t.common.requiredProfile}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-[#e8b4a2]">{t.notifications.title}</h1>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          {t.notifications.markAllRead}
        </Button>
      </div>

      {list.isLoading ? <p className="text-white/50">{t.common.loading}</p> : null}
      {!list.isLoading && (list.data?.length ?? 0) === 0 ? (
        <p className="text-white/50">{t.notifications.empty}</p>
      ) : null}

      <ul className="space-y-3">
        {(list.data ?? []).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={async () => {
                if (!item.readAt) {
                  try {
                    await markRead.mutateAsync(item.id);
                  } catch {
                    /* still open */
                  }
                }
                if (item.href) router.push(item.href);
              }}
              className={cn(
                'w-full rounded-2xl border p-4 text-start transition-colors',
                item.readAt
                  ? 'border-white/10 bg-white/5'
                  : 'border-[#e8b4a2]/40 bg-[#e8b4a2]/10',
              )}
            >
              <p className="flex flex-wrap items-center gap-2 font-medium text-[#f7efe8]">
                {item.title}
                {!item.readAt ? (
                  <span className="rounded-full bg-champagne px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                    {t.notifications.unread}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</p>
              <p className="mt-2 text-xs text-white/40">
                {new Date(item.createdAt).toLocaleString(intlLocale(locale))}
                {item.href ? ` · ${t.notifications.openRequest}` : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
