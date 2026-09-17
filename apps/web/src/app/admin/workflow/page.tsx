'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkflowStepDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

const EMPTY: Partial<WorkflowStepDto> = {
  title: '',
  description: '',
  isRequired: true,
  isActive: true,
  inputKind: 'CHECK',
  sortOrder: 0,
};

export default function AdminWorkflowPage() {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<WorkflowStepDto> | null>(null);

  const steps = useQuery({
    queryKey: ['admin-workflow-steps'],
    queryFn: () => authFetch<WorkflowStepDto[]>('/api/v1/admin/workflow-steps'),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-workflow-steps'] });
    await queryClient.invalidateQueries({ queryKey: ['workflow-steps'] });
  };

  const save = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      payload.id
        ? authFetch(`/api/v1/admin/workflow-steps/${payload.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload.body),
          })
        : authFetch('/api/v1/admin/workflow-steps', {
            method: 'POST',
            body: JSON.stringify(payload.body),
          }),
    onSuccess: async () => {
      setEditing(null);
      setError(null);
      await invalidate();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.admin.actionFailed);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/v1/admin/workflow-steps/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      authFetch('/api/v1/admin/workflow-steps/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  function move(id: string, direction: -1 | 1) {
    const list = steps.data ?? [];
    const index = list.findIndex((s) => s.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    const ids = list.map((s) => s.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) return;
    ids.splice(next, 0, moved);
    reorder.mutate(ids);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get('title') || '').trim();
    if (title.length < 2) {
      setError(t.admin.nameHint);
      return;
    }
    save.mutate({
      id: editing?.id,
      body: {
        title,
        description: String(form.get('description') || '') || undefined,
        isRequired: form.get('isRequired') === 'on',
        isActive: form.get('isActive') === 'on',
        inputKind: String(form.get('inputKind') || 'CHECK'),
        sortOrder: editing?.sortOrder ?? (steps.data?.length ?? 0) + 1,
      },
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
          <h1 className="font-display text-4xl text-ink">{t.admin.workflow}</h1>
          <p className="mt-2 text-muted">{t.admin.workflowSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/services" className="text-sm text-champagne hover:underline">
            {t.admin.services}
          </Link>
          <Button variant="primary" onClick={() => setEditing(EMPTY)}>
            {t.admin.addStep}
          </Button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
          <div>
            <label className="text-sm font-medium">{t.admin.stepTitle}</label>
            <input
              name="title"
              required
              minLength={2}
              maxLength={150}
              defaultValue={editing.title ?? ''}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.admin.stepDescription}</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editing.description ?? ''}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.admin.inputKind}</label>
            <select
              name="inputKind"
              defaultValue={editing.inputKind ?? 'CHECK'}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            >
              <option value="CHECK">{t.admin.inputCheck}</option>
              <option value="TEXT">{t.admin.inputText}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isRequired" type="checkbox" defaultChecked={editing.isRequired !== false} />
            {t.admin.stepRequired}
          </label>
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

      <ol className="space-y-3">
        {steps.data?.map((step, index) => (
          <li
            key={step.id}
            className="flex flex-col gap-3 rounded-xl border border-ink/5 bg-warm-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-champagne">
                {index + 1} · {step.isRequired ? t.common.required : t.common.optional}
                {step.isActive === false ? ` · ${t.admin.hidden}` : ''}
              </p>
              <h2 className="mt-1 font-medium text-ink">{step.title}</h2>
              {step.description ? <p className="mt-1 text-sm text-muted">{step.description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0 || reorder.isPending}
                onClick={() => move(step.id, -1)}
              >
                {t.admin.moveUp}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index === (steps.data?.length ?? 0) - 1 || reorder.isPending}
                onClick={() => move(step.id, 1)}
              >
                {t.admin.moveDown}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditing(step)}>
                {t.common.edit}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: t.common.confirmTitle,
                    description: t.admin.deleteConfirm,
                    confirmLabel: t.common.delete,
                    variant: 'primary',
                  });
                  if (!ok) return;
                  remove.mutate(step.id);
                }}
                disabled={remove.isPending}
              >
                {t.common.delete}
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
