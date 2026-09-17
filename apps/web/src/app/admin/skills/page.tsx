'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SkillDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

const EMPTY: Partial<SkillDto> = { name: '', description: '', isActive: true, sortOrder: 0 };

export default function AdminSkillsPage() {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<SkillDto> | null>(null);

  const skills = useQuery({
    queryKey: ['admin-skills'],
    queryFn: () => authFetch<SkillDto[]>('/api/v1/admin/skills'),
  });

  const save = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      payload.id
        ? authFetch(`/api/v1/admin/skills/${payload.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload.body),
          })
        : authFetch('/api/v1/admin/skills', {
            method: 'POST',
            body: JSON.stringify(payload.body),
          }),
    onSuccess: async () => {
      setEditing(null);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => authFetch(`/api/v1/admin/skills/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (name.length < 2) {
      setError(t.admin.nameHint);
      return;
    }
    save.mutate({
      id: editing?.id,
      body: {
        name,
        description: String(form.get('description') || '') || undefined,
        sortOrder: Number(form.get('sortOrder') || 0),
        isActive: form.get('isActive') === 'on',
      },
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.admin.skills}</h1>
          <p className="mt-2 text-muted">{t.admin.skillsSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/technicians" className="text-sm text-champagne hover:underline">
            {t.admin.expertsTitle}
          </Link>
          <Button variant="primary" onClick={() => setEditing(EMPTY)}>
            {t.admin.addSkill}
          </Button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
          <div>
            <label className="text-sm font-medium">{t.admin.name}</label>
            <input
              name="name"
              required
              minLength={2}
              maxLength={150}
              defaultValue={editing.name ?? ''}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
            <p className="mt-1 text-xs text-muted">{t.admin.nameHint}</p>
          </div>
          <div>
            <label className="text-sm font-medium">{t.review.commentLabel}</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing.description ?? ''}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
          </div>
          <input type="hidden" name="sortOrder" defaultValue={editing.sortOrder ?? skills.data?.length ?? 0} />
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={editing.isActive !== false} />
            {t.common.active}
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit" variant="gold" disabled={save.isPending}>
              {t.common.save}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {skills.data?.map((skill) => (
          <li
            key={skill.id}
            className="flex flex-col gap-3 rounded-xl border border-ink/5 bg-warm-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-medium text-ink">{skill.name}</h2>
              {skill.description ? <p className="mt-1 text-sm text-muted">{skill.description}</p> : null}
              {skill.isActive === false ? (
                <p className="mt-1 text-xs text-muted">{t.admin.hidden}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(skill)}>
                {t.common.edit}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!window.confirm(t.admin.deleteConfirm)) return;
                  remove.mutate(skill.id);
                }}
                disabled={remove.isPending}
              >
                {t.common.delete}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
