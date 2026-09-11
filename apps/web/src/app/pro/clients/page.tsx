'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

type ClientRow = { id: string; name: string; wigCount: number; lastActivityAt: string };

export default function ProClientsPage() {
  const { authFetch, user } = useAuth();
  const { t, format } = useLocale();
  const isTech = user?.roles?.includes('TECHNICIAN');
  const clients = useQuery({
    queryKey: ['pro-clients'],
    enabled: Boolean(isTech),
    queryFn: () => authFetch<ClientRow[]>('/api/v1/technicians/me/clients'),
  });

  if (!isTech) return <p className="text-white/60">{t.common.requiredProfile}</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-[#e8b4a2]">{t.pro.clientsTitle}</h1>
      {clients.isLoading ? (
        <p className="text-white/50">{t.common.loading}</p>
      ) : (clients.data?.length ?? 0) === 0 ? (
        <p className="text-white/50">{t.pro.clientsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {clients.data!.map((c) => (
            <li key={c.id}>
              <Link
                href={`/pro/clients/${c.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-4 hover:border-[#e8b4a2]/40"
              >
                <p className="font-medium text-[#f7efe8]">{c.name}</p>
                <p className="text-sm text-white/50">
                  {format(t.pro.wigCount, { n: c.wigCount })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
