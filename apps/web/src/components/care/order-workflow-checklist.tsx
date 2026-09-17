'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderWorkflowStepDto } from '@velure/contracts';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export function incompleteRequiredSteps(steps: OrderWorkflowStepDto[] | undefined) {
  return (steps ?? []).filter((step) => step.isRequired && !step.completed);
}

export function OrderWorkflowChecklist({
  orderId,
  locked,
}: {
  orderId: string;
  locked?: boolean;
}) {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<OrderWorkflowStepDto[]>([]);

  const workflow = useQuery({
    queryKey: ['order-workflow', orderId],
    queryFn: () =>
      authFetch<OrderWorkflowStepDto[]>(`/api/v1/technicians/me/orders/${orderId}/workflow`),
  });

  useEffect(() => {
    if (workflow.data) setLocal(workflow.data);
  }, [workflow.data]);

  const save = useMutation({
    mutationFn: (steps: OrderWorkflowStepDto[]) =>
      authFetch(`/api/v1/technicians/me/orders/${orderId}/workflow`, {
        method: 'PUT',
        body: JSON.stringify({
          steps: steps.map((s) => ({
            stepId: s.id,
            completed: s.completed,
            note: s.note,
          })),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['order-workflow', orderId] });
    },
  });

  if (workflow.isLoading || local.length === 0) return null;

  function commit(next: OrderWorkflowStepDto[]) {
    setLocal(next);
    save.mutate(next);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-display text-2xl text-[#f7efe8]">{t.pro.workflowTitle}</h2>
      <p className="text-sm text-white/60">{t.pro.workflowHint}</p>
      <ol className="space-y-3">
        {local.map((step, index) => (
          <li key={step.id} className="rounded-lg border border-white/10 p-3">
            <label className="flex items-start gap-3 text-sm text-[#f7efe8]">
              <input
                type="checkbox"
                className="mt-1"
                checked={step.completed}
                disabled={locked || save.isPending}
                onChange={(e) =>
                  commit(
                    local.map((s) =>
                      s.id === step.id ? { ...s, completed: e.target.checked } : s,
                    ),
                  )
                }
              />
              <span>
                <span className="text-xs uppercase tracking-wide text-[#e8b4a2]">
                  {index + 1} · {step.isRequired ? t.common.required : t.common.optional}
                </span>
                <span className="mt-1 block font-medium">{step.title}</span>
                {step.description ? (
                  <span className="mt-1 block text-white/55">{step.description}</span>
                ) : null}
              </span>
            </label>
            {!step.completed && !locked ? (
              <button
                type="button"
                className="mt-2 text-xs text-[#e8b4a2] hover:underline"
                disabled={save.isPending}
                onClick={() =>
                  commit(local.map((s) => (s.id === step.id ? { ...s, completed: true } : s)))
                }
              >
                {t.pro.skipStep}
              </button>
            ) : null}
            {step.inputKind === 'TEXT' ? (
              <textarea
                rows={2}
                disabled={locked}
                value={step.note ?? ''}
                placeholder={t.pro.stepNote}
                onChange={(e) =>
                  setLocal((prev) =>
                    prev.map((s) =>
                      s.id === step.id
                        ? {
                            ...s,
                            note: e.target.value,
                            completed: Boolean(e.target.value.trim()),
                          }
                        : s,
                    ),
                  )
                }
                onBlur={(e) => {
                  const value = e.target.value;
                  commit(
                    local.map((s) =>
                      s.id === step.id
                        ? { ...s, note: value, completed: Boolean(value.trim()) }
                        : s,
                    ),
                  );
                }}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#120d0f] px-3 py-2 text-sm text-[#f7efe8]"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
