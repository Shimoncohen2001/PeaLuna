'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nextTechnicianFollowUp, type TechnicianFollowUp } from '@velure/domain';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/media/camera-capture';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import {
  careLabel,
  careUi,
  CONDITION_OPTIONS,
  HAIR_KIND_OPTIONS,
  OPERATION_CODES,
  PHOTO_ANGLES,
  TANGLE_OPTIONS,
  WEAR_OPTIONS,
  WIG_KIND_OPTIONS,
} from '@/lib/i18n/care';
import { useLocale } from '@/lib/i18n/locale';
import { uploadWigMedia } from '@/lib/upload-media';
import { OrderWorkflowChecklist, incompleteRequiredSteps } from '@/components/care/order-workflow-checklist';
import { HAIR_ADD_CODES, type OrderWorkflowStepDto, type SkillDto } from '@velure/contracts';

type Photo = {
  id: string;
  url: string | null;
  phase: 'BEFORE' | 'AFTER' | null;
  angle: string | null;
  kind: 'image' | 'video';
};

type CareReport = {
  id: string;
  wigId: string;
  orderId: string;
  status: 'DRAFT' | 'SUBMITTED';
  technicianDisplayName: string;
  wigReference: string;
  wigName: string;
  beforeGeneralCondition: string | null;
  beforeWeightGrams: number | null;
  wigAgeYears: number | null;
  wigKind: string | null;
  hairKind: string | null;
  lengthCm: number | null;
  color: string | null;
  laceCondition: string | null;
  baseCondition: string | null;
  hairCondition: string | null;
  wearLevel: string | null;
  tangleLevel: string | null;
  hairLossObserved: boolean | null;
  visibleDamage: string | null;
  repairsNeeded: string | null;
  beforeInternalNotes: string | null;
  operations: { code: string; note: string | null }[];
  hairAdded: boolean;
  addedHairKind: string | null;
  addedHairGrams: number | null;
  addedHairLengthCm: number | null;
  addedHairColor: string | null;
  addedHairTexture: string | null;
  addedHairOrigin: string | null;
  addedHairZone: string | null;
  addedHairComment: string | null;
  afterWeightGrams: number | null;
  afterGeneralCondition: string | null;
  afterHairCondition: string | null;
  afterLaceCondition: string | null;
  afterBaseCondition: string | null;
  afterWearLevel: string | null;
  resultNotes: string | null;
  remainingIssues: string | null;
  afterInternalNotes: string | null;
  washFrequency: string | null;
  recommendedProducts: string | null;
  productsToAvoid: string | null;
  stylingAdvice: string | null;
  storageAdvice: string | null;
  heatAdvice: string | null;
  laceAdvice: string | null;
  nextCareAt: string | null;
  otherAdvice: string | null;
  weightDeltaGrams: number | null;
  photos: Photo[];
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: 'CARD' | 'CASH';
  canConfirmCash?: boolean;
};

type JobBrief = {
  id: string;
  status: string;
  paymentStatus: string;
  canConfirmCash: boolean;
};

function followUpHref(orderId: string, followUp: TechnicianFollowUp): string {
  if (followUp === 'CONFIRM_CASH') return `/pro/orders/${orderId}?done=care&next=cash`;
  return '/pro';
}

function followUpCopy(
  followUp: TechnicianFollowUp,
  ui: ReturnType<typeof careUi>,
): string {
  if (followUp === 'CONFIRM_CASH') return ui.finishSuccessCash;
  if (followUp === 'WAIT_CLIENT_CAPTURE') return ui.finishSuccessCard;
  return ui.finishSuccessDone;
}

const HAIR_OPS = new Set<string>(HAIR_ADD_CODES);

function num(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-[#f7efe8]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/15 bg-[#120d0f] px-3 py-2 text-[#f7efe8]';

export function CareReportForm({ orderId }: { orderId: string }) {
  const { authFetch } = useAuth();
  const { locale, format, t } = useLocale();
  const ui = careUi(locale);
  const STEPS = ui.steps;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CareReport>>({});
  const [busyUpload, setBusyUpload] = useState(false);
  const submitGuard = useRef(false);

  const report = useQuery({
    queryKey: ['care-report', orderId],
    queryFn: () => authFetch<CareReport>(`/api/v1/technicians/me/orders/${orderId}/care-report`),
  });

  const job = useQuery({
    queryKey: ['pro-order', orderId],
    queryFn: () => authFetch<JobBrief>(`/api/v1/technicians/me/orders/${orderId}`),
  });

  const workflow = useQuery({
    queryKey: ['order-workflow', orderId],
    queryFn: () =>
      authFetch<OrderWorkflowStepDto[]>(`/api/v1/technicians/me/orders/${orderId}/workflow`),
  });

  const catalogSkills = useQuery({
    queryKey: ['skills'],
    queryFn: () => authFetch<SkillDto[]>('/api/v1/skills'),
  });

  useEffect(() => {
    if (!report.data) return;
    setForm((prev) => ({
      ...report.data,
      ...prev,
      photos: report.data.photos,
      id: report.data.id,
      status: report.data.status,
      wigId: report.data.wigId,
      wigName: report.data.wigName,
      wigReference: report.data.wigReference,
    }));
  }, [report.data]);

  const selectedOps = form.operations ?? [];
  const needsHair = selectedOps.some((o) => HAIR_OPS.has(o.code));
  const locked = report.data?.status === 'SUBMITTED';
  const operationCatalog = useMemo(() => {
    if (catalogSkills.data && catalogSkills.data.length > 0) {
      return catalogSkills.data.map((s) => ({ code: s.slug, label: s.name }));
    }
    return OPERATION_CODES.map((code) => ({ code, label: careLabel(locale, code) }));
  }, [catalogSkills.data, locale]);

  function operationLabel(code: string) {
    return operationCatalog.find((o) => o.code === code)?.label ?? careLabel(locale, code);
  }

  const payload = useMemo(
    () => ({
      beforeGeneralCondition: form.beforeGeneralCondition ?? null,
      beforeWeightGrams: form.beforeWeightGrams ?? null,
      wigAgeYears: form.wigAgeYears ?? null,
      wigKind: form.wigKind ?? null,
      hairKind: form.hairKind ?? null,
      lengthCm: form.lengthCm ?? null,
      color: form.color || null,
      laceCondition: form.laceCondition ?? null,
      baseCondition: form.baseCondition ?? null,
      hairCondition: form.hairCondition ?? null,
      wearLevel: form.wearLevel ?? null,
      tangleLevel: form.tangleLevel ?? null,
      hairLossObserved: form.hairLossObserved ?? null,
      visibleDamage: form.visibleDamage || null,
      repairsNeeded: form.repairsNeeded || null,
      beforeInternalNotes: form.beforeInternalNotes || null,
      operations: selectedOps.map((op) => ({ code: op.code, note: op.note || null })),
      hairAdded: needsHair,
      addedHairKind: form.addedHairKind ?? null,
      addedHairGrams: form.addedHairGrams ?? null,
      addedHairLengthCm: form.addedHairLengthCm ?? null,
      addedHairColor: form.addedHairColor || null,
      addedHairTexture: form.addedHairTexture || null,
      addedHairOrigin: form.addedHairOrigin || null,
      addedHairZone: form.addedHairZone || null,
      addedHairComment: form.addedHairComment || null,
      afterWeightGrams: form.afterWeightGrams ?? null,
      afterGeneralCondition: form.afterGeneralCondition ?? null,
      afterHairCondition: form.afterHairCondition ?? null,
      afterLaceCondition: form.afterLaceCondition ?? null,
      afterBaseCondition: form.afterBaseCondition ?? null,
      afterWearLevel: form.afterWearLevel ?? null,
      resultNotes: form.resultNotes || null,
      remainingIssues: form.remainingIssues || null,
      afterInternalNotes: form.afterInternalNotes || null,
      washFrequency: form.washFrequency || null,
      recommendedProducts: form.recommendedProducts || null,
      productsToAvoid: form.productsToAvoid || null,
      stylingAdvice: form.stylingAdvice || null,
      storageAdvice: form.storageAdvice || null,
      heatAdvice: form.heatAdvice || null,
      laceAdvice: form.laceAdvice || null,
      nextCareAt: form.nextCareAt || null,
      otherAdvice: form.otherAdvice || null,
    }),
    [form, selectedOps, needsHair],
  );

  const save = useMutation({
    mutationFn: () =>
      authFetch(`/api/v1/technicians/me/orders/${orderId}/care-report`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  });

  const submit = useMutation({
    mutationFn: async () => {
      try {
        return await authFetch<CareReport>(`/api/v1/technicians/me/orders/${orderId}/care-report/submit`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        if (err instanceof ApiClientError && err.code === 'CARE_REPORT_LOCKED') {
          const current = await authFetch<JobBrief>(`/api/v1/technicians/me/orders/${orderId}`);
          return {
            ...(report.data as CareReport),
            status: 'SUBMITTED' as const,
            orderStatus: current.status,
            paymentStatus: current.paymentStatus,
            canConfirmCash: current.canConfirmCash,
          };
        }
        throw err;
      }
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['care-report', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['pro-order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['pro-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
    onError: (err) => {
      submitGuard.current = false;
      setError(err instanceof ApiClientError ? err.message : ui.incomplete);
    },
  });

  const done = locked || submit.isSuccess;
  const followUp = nextTechnicianFollowUp(
    submit.data?.orderStatus ?? job.data?.status ?? 'COMPLETED',
    submit.data?.paymentStatus ?? job.data?.paymentStatus ?? 'UNPAID',
  );
  const nextHref = followUpHref(orderId, followUp);

  useEffect(() => {
    if (!submit.isSuccess) return;
    const timer = window.setTimeout(() => {
      router.replace(nextHref);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [submit.isSuccess, nextHref, router]);

  async function upload(phase: 'BEFORE' | 'AFTER', angle: string, file: File) {
    if (!report.data) return;
    setBusyUpload(true);
    setError(null);
    try {
      await uploadWigMedia(
        file,
        {
          wigId: report.data.wigId,
          orderId,
          careReportId: report.data.id,
          purpose: phase === 'BEFORE' ? 'BEFORE_CARE' : 'AFTER_CARE',
          photoPhase: phase,
          photoAngle: angle as 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'LACE' | 'EXTRA',
        },
        authFetch,
      );
      await queryClient.invalidateQueries({ queryKey: ['care-report', orderId] });
    } catch (err) {
      setError(
        err instanceof ApiClientError || err instanceof Error ? err.message : ui.uploadImpossible,
      );
    } finally {
      setBusyUpload(false);
    }
  }

  function set<K extends keyof CareReport>(key: K, value: CareReport[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleOp(code: string) {
    const current = selectedOps;
    const exists = current.find((o) => o.code === code);
    set(
      'operations',
      exists ? current.filter((o) => o.code !== code) : [...current, { code, note: null }],
    );
  }

  function setOpNote(code: string, note: string) {
    set(
      'operations',
      selectedOps.map((op) => (op.code === code ? { ...op, note: note || null } : op)),
    );
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (
        !form.beforeGeneralCondition ||
        !form.beforeWeightGrams ||
        !form.wigKind ||
        !form.hairKind ||
        !form.lengthCm ||
        !form.color ||
        !form.laceCondition ||
        !form.baseCondition ||
        !form.hairCondition ||
        !form.wearLevel ||
        !form.tangleLevel ||
        form.hairLossObserved == null
      ) {
        return ui.errBefore;
      }
    }
    if (current === 1 && beforePhotos.length === 0) {
      return ui.errBeforePhoto;
    }
    if (current === 2 && selectedOps.length === 0) {
      return ui.errOps;
    }
    if (current === 3 && needsHair) {
      if (
        !form.addedHairKind ||
        !form.addedHairGrams ||
        !form.addedHairLengthCm ||
        !form.addedHairColor ||
        !form.addedHairZone
      ) {
        return ui.errHair;
      }
    }
    if (current === 4) {
      if (
        !form.afterWeightGrams ||
        !form.afterGeneralCondition ||
        !form.afterHairCondition ||
        !form.afterLaceCondition ||
        !form.afterBaseCondition ||
        !form.afterWearLevel ||
        !form.resultNotes
      ) {
        return ui.errAfter;
      }
    }
    if (current === 5 && afterPhotos.length === 0) {
      return ui.errAfterPhoto;
    }
    if (current === 6) {
      const adviceOk = [
        form.otherAdvice,
        form.stylingAdvice,
        form.storageAdvice,
        form.heatAdvice,
        form.laceAdvice,
        form.recommendedProducts,
      ].some((v) => Boolean(v && String(v).trim()));
      if (!form.washFrequency || !adviceOk) {
        return ui.errAdvice;
      }
    }
    return null;
  }

  async function goNext(skip: boolean) {
    if (!skip) {
      const msg = validateStep(step);
      if (msg) {
        setError(msg);
        return;
      }
    }
    setError(null);
    try {
      await save.mutateAsync();
      setStep((s) => s + (s === 2 && !needsHair ? 2 : 1));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t.pro.saveFailed);
    }
  }

  const photos = form.photos ?? report.data?.photos ?? [];
  const beforePhotos = photos.filter((p) => p.phase === 'BEFORE');
  const afterPhotos = photos.filter((p) => p.phase === 'AFTER');
  const delta =
    form.beforeWeightGrams != null && form.afterWeightGrams != null
      ? form.afterWeightGrams - form.beforeWeightGrams
      : null;

  if (report.isLoading) return <p className="text-white/50">{ui.loadingSheet}</p>;
  if (!report.data) return <p className="text-red-300">{ui.openFailed}</p>;

  if (done) {
    return (
      <CareFinishedPanel
        ui={ui}
        followUp={followUp}
        nextHref={nextHref}
        autoRedirect={submit.isSuccess}
        jobHref={`/pro/orders/${orderId}`}
        wigHref={report.data.wigId ? `/pro/wigs/${report.data.wigId}` : null}
        wigLabel={t.pro.wigHistory}
        onGo={(href) => router.replace(href)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.15em] text-[#e8b4a2]">{ui.sheetEyebrow}</p>
        <h1 className="font-display text-4xl text-[#f7efe8]">{ui.sheetTitle}</h1>
        <p className="mt-2 text-white/50">{ui.sheetHint}</p>
      </div>
      <OrderWorkflowChecklist orderId={orderId} locked={locked} />
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs ${
                i === step ? 'bg-[#e8b4a2] text-[#1a1214]' : 'bg-white/10 text-white/60'
              }`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {step === 0 ? (
        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
          <Field label={ui.general}>
            <select
              className={inputClass}
              value={form.beforeGeneralCondition ?? ''}
              onChange={(e) => set('beforeGeneralCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.weightBefore}>
            <input
              type="number"
              className={inputClass}
              value={form.beforeWeightGrams ?? ''}
              onChange={(e) => set('beforeWeightGrams', num(e.target.value))}
            />
          </Field>
          <Field label={ui.wigAge}>
            <input
              type="number"
              className={inputClass}
              value={form.wigAgeYears ?? ''}
              onChange={(e) => set('wigAgeYears', num(e.target.value))}
            />
          </Field>
          <Field label={ui.wigKind}>
            <select
              className={inputClass}
              value={form.wigKind ?? ''}
              onChange={(e) => set('wigKind', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {WIG_KIND_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.hairKind}>
            <select
              className={inputClass}
              value={form.hairKind ?? ''}
              onChange={(e) => set('hairKind', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {HAIR_KIND_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.lengthCm}>
            <input
              type="number"
              className={inputClass}
              value={form.lengthCm ?? ''}
              onChange={(e) => set('lengthCm', num(e.target.value))}
            />
          </Field>
          <Field label={ui.color}>
            <input
              className={inputClass}
              value={form.color ?? ''}
              onChange={(e) => set('color', e.target.value)}
            />
          </Field>
          <Field label={ui.lace}>
            <select
              className={inputClass}
              value={form.laceCondition ?? ''}
              onChange={(e) => set('laceCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.base}>
            <select
              className={inputClass}
              value={form.baseCondition ?? ''}
              onChange={(e) => set('baseCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.hair}>
            <select
              className={inputClass}
              value={form.hairCondition ?? ''}
              onChange={(e) => set('hairCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.wear}>
            <select
              className={inputClass}
              value={form.wearLevel ?? ''}
              onChange={(e) => set('wearLevel', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {WEAR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.tangle}>
            <select
              className={inputClass}
              value={form.tangleLevel ?? ''}
              onChange={(e) => set('tangleLevel', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {TANGLE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.hairLoss}>
            <select
              className={inputClass}
              value={form.hairLossObserved == null ? '' : form.hairLossObserved ? 'yes' : 'no'}
              onChange={(e) =>
                set('hairLossObserved', e.target.value === '' ? null : e.target.value === 'yes')
              }
            >
              <option value="">{t.common.choose}</option>
              <option value="yes">{t.common.yes}</option>
              <option value="no">{t.common.no}</option>
            </select>
          </Field>
          <Field label={ui.visibleDamage}>
            <textarea
              className={inputClass}
              value={form.visibleDamage ?? ''}
              onChange={(e) => set('visibleDamage', e.target.value)}
            />
          </Field>
          <Field label={ui.repairsNeeded}>
            <textarea
              className={inputClass}
              value={form.repairsNeeded ?? ''}
              onChange={(e) => set('repairsNeeded', e.target.value)}
            />
          </Field>
          <Field label={ui.internalNotes}>
            <textarea
              className={inputClass}
              value={form.beforeInternalNotes ?? ''}
              onChange={(e) => set('beforeInternalNotes', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 1 || step === 5 ? (
        <PhotoGrid
          phase={step === 1 ? 'BEFORE' : 'AFTER'}
          photos={step === 1 ? beforePhotos : afterPhotos}
          busy={busyUpload || locked}
          onPick={(angle, file) => void upload(step === 1 ? 'BEFORE' : 'AFTER', angle, file)}
        />
      ) : null}

      {step === 2 ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {operationCatalog.map((item) => {
              const checked = selectedOps.some((o) => o.code === item.code);
              return (
                <label key={item.code} className="flex items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" checked={checked} onChange={() => toggleOp(item.code)} />
                  {item.label}
                </label>
              );
            })}
          </div>
          {selectedOps.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-white/50">{ui.opNotes}</p>
              {selectedOps.map((op) => (
                <Field key={op.code} label={operationLabel(op.code)}>
                  <input
                    className={inputClass}
                    value={op.note ?? ''}
                    onChange={(e) => setOpNote(op.code, e.target.value)}
                    placeholder={ui.comment}
                  />
                </Field>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
          {!needsHair ? (
            <p className="col-span-full text-sm text-white/50">
              {ui.hairAddedHint}
            </p>
          ) : (
            <>
              <Field label={ui.hairKind}>
                <select
                  className={inputClass}
                  value={form.addedHairKind ?? ''}
                  onChange={(e) => set('addedHairKind', e.target.value || null)}
                >
                  <option value="">{t.common.choose}</option>
                  {HAIR_KIND_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {careLabel(locale, c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={ui.addedGrams}>
                <input
                  type="number"
                  className={inputClass}
                  value={form.addedHairGrams ?? ''}
                  onChange={(e) => set('addedHairGrams', num(e.target.value))}
                />
              </Field>
              <Field label={ui.lengthCm}>
                <input
                  type="number"
                  className={inputClass}
                  value={form.addedHairLengthCm ?? ''}
                  onChange={(e) => set('addedHairLengthCm', num(e.target.value))}
                />
              </Field>
              <Field label={ui.color}>
                <input
                  className={inputClass}
                  value={form.addedHairColor ?? ''}
                  onChange={(e) => set('addedHairColor', e.target.value)}
                />
              </Field>
              <Field label={ui.texture}>
                <input
                  className={inputClass}
                  value={form.addedHairTexture ?? ''}
                  onChange={(e) => set('addedHairTexture', e.target.value)}
                />
              </Field>
              <Field label={ui.origin}>
                <input
                  className={inputClass}
                  value={form.addedHairOrigin ?? ''}
                  onChange={(e) => set('addedHairOrigin', e.target.value)}
                />
              </Field>
              <Field label={ui.zone}>
                <input
                  className={inputClass}
                  value={form.addedHairZone ?? ''}
                  onChange={(e) => set('addedHairZone', e.target.value)}
                />
              </Field>
              <Field label={ui.comment}>
                <textarea
                  className={inputClass}
                  value={form.addedHairComment ?? ''}
                  onChange={(e) => set('addedHairComment', e.target.value)}
                />
              </Field>
            </>
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
          <Field label={ui.weightAfter}>
            <input
              type="number"
              className={inputClass}
              value={form.afterWeightGrams ?? ''}
              onChange={(e) => set('afterWeightGrams', num(e.target.value))}
            />
          </Field>
          {delta != null ? (
            <p className="self-end text-sm text-[#e8b4a2]">
              Différence de poids : {delta > 0 ? '+' : ''}
              {delta} g
            </p>
          ) : null}
          <Field label={ui.generalAfter}>
            <select
              className={inputClass}
              value={form.afterGeneralCondition ?? ''}
              onChange={(e) => set('afterGeneralCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.hair}>
            <select
              className={inputClass}
              value={form.afterHairCondition ?? ''}
              onChange={(e) => set('afterHairCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.lace}>
            <select
              className={inputClass}
              value={form.afterLaceCondition ?? ''}
              onChange={(e) => set('afterLaceCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.base}>
            <select
              className={inputClass}
              value={form.afterBaseCondition ?? ''}
              onChange={(e) => set('afterBaseCondition', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.wearAfter}>
            <select
              className={inputClass}
              value={form.afterWearLevel ?? ''}
              onChange={(e) => set('afterWearLevel', e.target.value || null)}
            >
              <option value="">{t.common.choose}</option>
              {WEAR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {careLabel(locale, c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ui.result}>
            <textarea
              className={inputClass}
              value={form.resultNotes ?? ''}
              onChange={(e) => set('resultNotes', e.target.value)}
            />
          </Field>
          <Field label={ui.watchInternal}>
            <textarea
              className={inputClass}
              value={form.remainingIssues ?? ''}
              onChange={(e) => set('remainingIssues', e.target.value)}
            />
          </Field>
          <Field label={ui.afterInternal}>
            <textarea
              className={inputClass}
              value={form.afterInternalNotes ?? ''}
              onChange={(e) => set('afterInternalNotes', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
          <Field label={ui.washFreq}>
            <input
              className={inputClass}
              value={form.washFrequency ?? ''}
              onChange={(e) => set('washFrequency', e.target.value)}
            />
          </Field>
          <Field label={ui.nextCare}>
            <input
              type="date"
              className={inputClass}
              value={form.nextCareAt ? form.nextCareAt.slice(0, 10) : ''}
              onChange={(e) =>
                set('nextCareAt', e.target.value ? new Date(e.target.value).toISOString() : null)
              }
            />
          </Field>
          <Field label={ui.recommended}>
            <textarea
              className={inputClass}
              value={form.recommendedProducts ?? ''}
              onChange={(e) => set('recommendedProducts', e.target.value)}
            />
          </Field>
          <Field label={ui.avoid}>
            <textarea
              className={inputClass}
              value={form.productsToAvoid ?? ''}
              onChange={(e) => set('productsToAvoid', e.target.value)}
            />
          </Field>
          <Field label={ui.styling}>
            <textarea
              className={inputClass}
              value={form.stylingAdvice ?? ''}
              onChange={(e) => set('stylingAdvice', e.target.value)}
            />
          </Field>
          <Field label={ui.storage}>
            <textarea
              className={inputClass}
              value={form.storageAdvice ?? ''}
              onChange={(e) => set('storageAdvice', e.target.value)}
            />
          </Field>
          <Field label={ui.heat}>
            <textarea
              className={inputClass}
              value={form.heatAdvice ?? ''}
              onChange={(e) => set('heatAdvice', e.target.value)}
            />
          </Field>
          <Field label={ui.laceAdvice}>
            <textarea
              className={inputClass}
              value={form.laceAdvice ?? ''}
              onChange={(e) => set('laceAdvice', e.target.value)}
            />
          </Field>
          <Field label={ui.otherAdvice}>
            <textarea
              className={inputClass}
              value={form.otherAdvice ?? ''}
              onChange={(e) => set('otherAdvice', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 7 ? (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <h2 className="font-display text-2xl text-[#f7efe8]">{ui.summary}</h2>
          <p>
            Avant : {careLabel(locale, form.beforeGeneralCondition ?? '')} · {form.beforeWeightGrams ?? '—'} g
          </p>
          <p>Travail : {selectedOps.map((o) => operationLabel(o.code)).join(', ') || '—'}</p>
          <p>
            Après : {careLabel(locale, form.afterGeneralCondition ?? '')} · {form.afterWeightGrams ?? '—'} g
            {delta != null ? ` (${delta > 0 ? '+' : ''}${delta} g)` : ''}
          </p>
          <p>{format(ui.photosCount, { before: beforePhotos.length, after: afterPhotos.length })}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PHOTO_ANGLES.filter((a) => a !== 'EXTRA').map((angle) => {
              const before = beforePhotos.find((p) => p.angle === angle);
              const after = afterPhotos.find((p) => p.angle === angle);
              if (!before && !after) return null;
              return (
                <div key={angle} className="rounded-lg border border-white/10 p-2">
                  <p className="mb-2 text-xs text-white/50">{careLabel(locale, angle)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {before?.url ? <img src={before.url} alt="" className="h-24 w-full rounded object-cover" /> : <div className="h-24 rounded bg-white/5" />}
                    {after?.url ? <img src={after.url} alt="" className="h-24 w-full rounded object-cover" /> : <div className="h-24 rounded bg-white/5" />}
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">{ui.beforeAfter}</p>
                </div>
              );
            })}
          </div>
          <p>{format(ui.adviceLine, { text: form.washFrequency || form.otherAdvice || ui.toComplete })}</p>
          <p className="text-[#e8b4a2]">{ui.lockHint}</p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((s) => s - (s === 4 && !needsHair ? 2 : 1))}>
            {t.common.back}
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <>
            <Button variant="gold" onClick={() => void goNext(false)}>
              {t.common.continue}
            </Button>
            <Button variant="secondary" onClick={() => void goNext(true)}>
              {t.common.skip}
            </Button>
          </>
        ) : (
          <Button
            variant="gold"
            className="min-h-11 w-full sm:w-auto"
            disabled={submit.isPending || submit.isSuccess}
            onClick={() => {
              if (submitGuard.current || submit.isPending) return;
              if (incompleteRequiredSteps(workflow.data).length > 0) {
                setError(t.pro.workflowIncomplete);
                return;
              }
              submitGuard.current = true;
              submit.mutate();
            }}
          >
            {submit.isPending ? ui.validating : ui.finishCare}
          </Button>
        )}
      </div>
      {step < STEPS.length - 1 ? (
        <p className="text-xs text-white/45">{ui.skipHint}</p>
      ) : null}
    </div>
  );
}

function CareFinishedPanel({
  ui,
  followUp,
  nextHref,
  autoRedirect,
  jobHref,
  wigHref,
  wigLabel,
  onGo,
}: {
  ui: ReturnType<typeof careUi>;
  followUp: TechnicianFollowUp;
  nextHref: string;
  autoRedirect: boolean;
  jobHref: string;
  wigHref: string | null;
  wigLabel: string;
  onGo: (href: string) => void;
}) {
  const primaryLabel = followUp === 'CONFIRM_CASH' ? ui.nextCash : ui.nextDashboard;
  return (
    <div className="space-y-5 rounded-2xl border border-[#e8b4a2]/40 bg-[#e8b4a2]/10 p-6">
      <h2 className="font-display text-3xl text-[#e8b4a2]">{ui.finishSuccessTitle}</h2>
      <p className="text-sm text-white/75">{followUpCopy(followUp, ui)}</p>
      {autoRedirect ? <p className="text-xs text-white/45">{ui.redirecting}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gold" className="w-full sm:w-auto" onClick={() => onGo(nextHref)}>
          {primaryLabel}
        </Button>
        {followUp === 'CONFIRM_CASH' ? (
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onGo('/pro')}>
            {ui.nextDashboard}
          </Button>
        ) : (
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onGo(jobHref)}>
            {ui.nextJob}
          </Button>
        )}
      </div>
      {wigHref ? (
        <button type="button" onClick={() => onGo(wigHref)} className="text-sm text-[#e8b4a2] hover:underline">
          {wigLabel}
        </button>
      ) : null}
    </div>
  );
}

function PhotoGrid({
  phase,
  photos,
  busy,
  onPick,
}: {
  phase: 'BEFORE' | 'AFTER';
  photos: Photo[];
  busy: boolean;
  onPick: (angle: string, file: File) => void;
}) {
  const { locale } = useLocale();
  const ui = careUi(locale);
  const angles = PHOTO_ANGLES.filter((a) => a !== 'EXTRA');
  const extras = photos.filter((p) => p.angle === 'EXTRA');
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-display text-2xl text-[#f7efe8]">
        {phase === 'BEFORE' ? ui.photosBefore : ui.photosAfter}
      </h2>
      <p className="mt-1 text-xs text-white/45">{ui.cameraHint}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {angles.map((angle) => {
          const shot = photos.find((p) => p.angle === angle);
          return (
            <li key={angle} className="rounded-lg border border-white/10 p-3">
              <p className="mb-2 text-xs text-white/50">{careLabel(locale, angle)}</p>
              {shot?.url ? (
                <img src={shot.url} alt="" className="mb-2 h-28 w-full rounded object-cover" />
              ) : null}
              <CameraCapture
                disabled={busy}
                tone="dark"
                cameraLabel={ui.takePhoto}
                libraryLabel={ui.chooseLibrary}
                onPick={(files) => {
                  const file = files[0];
                  if (file) onPick(angle, file);
                }}
              />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-lg border border-white/10 p-3">
        <p className="mb-2 text-xs text-white/50">{ui.extraPhotos}</p>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {extras.map((shot) =>
            shot.url ? (
              <img key={shot.id} src={shot.url} alt="" className="h-24 w-full rounded object-cover" />
            ) : null,
          )}
        </div>
        <CameraCapture
          disabled={busy}
          tone="dark"
          cameraLabel={ui.takePhoto}
          libraryLabel={ui.chooseLibrary}
          onPick={(files) => {
            const file = files[0];
            if (file) onPick('EXTRA', file);
          }}
        />
      </div>
    </section>
  );
}
