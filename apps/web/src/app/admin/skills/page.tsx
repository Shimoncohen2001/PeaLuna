'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SkillDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export default function AdminSkillsPage() {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [newName, setNewName] = useState('');

  const skills = useQuery({
    queryKey: ['admin-skills'],
    queryFn: () => authFetch<SkillDto[]>('/api/v1/admin/skills'),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
    await queryClient.invalidateQueries({ queryKey: ['skills'] });
  };

  const save = useMutation({
    mutationFn: (payload: { id?: string; name: string }) =>
      payload.id
        ? authFetch(`/api/v1/admin/skills/${payload.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: payload.name }),
          })
        : authFetch('/api/v1/admin/skills', {
            method: 'POST',
            body: JSON.stringify({
              name: payload.name,
              sortOrder: skills.data?.length ?? 0,
              isActive: true,
            }),
          }),
    onSuccess: async () => {
      setEditingId(null);
      setDraftName('');
      setNewName('');
      setError(null);
      await invalidate();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => authFetch(`/api/v1/admin/skills/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  function submitNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (name.length < 2) {
      setError(t.admin.nameHint);
      return;
    }
    save.mutate({ name });
  }

  function submitEdit(id: string) {
    const name = draftName.trim();
    if (name.length < 2) {
      setError(t.admin.nameHint);
      return;
    }
    save.mutate({ id, name });
  }

  const rows = (skills.data ?? []).filter((skill) => skill.isActive !== false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.admin.skills}</h1>
          <p className="mt-2 text-muted">{t.admin.skillsSubtitle}</p>
        </div>
        <Link href="/admin/technicians" className="text-sm text-champagne hover:underline">
          {t.admin.expertsTitle}
        </Link>
      </div>

      <form onSubmit={submitNew} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t.admin.addSkill}
          minLength={2}
          maxLength={150}
          className="flex-1 rounded-lg border border-ink/10 px-3 py-2"
        />
        <Button type="submit" variant="gold" disabled={save.isPending}>
          {t.admin.addSkill}
        </Button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <ul className="overflow-hidden rounded-2xl border border-ink/10 bg-warm-white">
        {rows.map((skill) => (
          <li
            key={skill.id}
            className="flex items-center gap-3 border-b border-ink/5 px-4 py-3 last:border-b-0"
          >
            {editingId === skill.id ? (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="flex-1 rounded-md border border-ink/10 px-2 py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitEdit(skill.id);
                  }
                }}
              />
            ) : (
              <span className={`flex-1 text-sm ${skill.isActive === false ? 'text-muted' : 'text-ink'}`}>
                {skill.name}
                {skill.isActive === false ? ` · ${t.admin.hidden}` : ''}
              </span>
            )}
            <div className="flex shrink-0 gap-2">
              {editingId === skill.id ? (
                <>
                  <Button variant="gold" size="sm" onClick={() => submitEdit(skill.id)}>
                    {t.common.save}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setDraftName('');
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(skill.id);
                      setDraftName(skill.name);
                    }}
                  >
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
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
