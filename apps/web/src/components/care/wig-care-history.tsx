'use client';

import { careLabel, careUi } from '@/lib/i18n/care';
import { useLocale } from '@/lib/i18n/locale';
import { intlLocale } from '@/lib/format';

type Photo = { id: string; url: string | null; phase: string | null; angle: string | null };
type HistoryItem = {
  id: string;
  submittedAt: string | null;
  technicianDisplayName: string;
  beforeGeneralCondition: string | null;
  beforeWeightGrams: number | null;
  afterGeneralCondition: string | null;
  afterWeightGrams: number | null;
  weightDeltaGrams: number | null;
  hairAdded: boolean;
  operations: { code: string }[];
  photos: Photo[];
  washFrequency: string | null;
  recommendedProducts: string | null;
  productsToAvoid: string | null;
  stylingAdvice: string | null;
  storageAdvice: string | null;
  heatAdvice: string | null;
  laceAdvice: string | null;
  nextCareAt: string | null;
  otherAdvice: string | null;
  remainingIssues?: string | null;
};

type Overview = {
  id: string;
  reference: string;
  name: string;
  currentCondition: string | null;
  currentWeightGrams: number | null;
  lastCareAt: string | null;
  lastTechnicianName: string | null;
  latestAdvice: HistoryItem | null;
  history: HistoryItem[];
  customer?: { name: string; email: string };
};

export function WigCareHistory({
  data,
  variant,
}: {
  data: Overview;
  variant: 'pro' | 'customer';
}) {
  const { locale, t } = useLocale();
  const ui = careUi(locale);
  const dateLocale = intlLocale(locale);
  const dark = variant === 'pro';
  const card = dark
    ? 'rounded-2xl border border-white/10 bg-white/5 p-6'
    : 'rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6';
  const title = dark ? 'text-[#f7efe8]' : 'text-ink';
  const muted = dark ? 'text-white/60' : 'text-muted';

  return (
    <div className="space-y-6">
      <div>
        <p className={`text-sm uppercase tracking-[0.15em] ${dark ? 'text-[#e8b4a2]' : 'text-champagne'}`}>
          {data.reference}
        </p>
        <h1 className={`font-display text-4xl ${title}`}>{data.name}</h1>
        {data.customer ? <p className={`mt-1 ${muted}`}>{data.customer.name}</p> : null}
      </div>

      <section className={card}>
        <h2 className={`font-display text-2xl ${title}`}>{ui.currentState}</h2>
        <p className={`mt-2 ${muted}`}>
          {data.currentCondition ? careLabel(locale, data.currentCondition) : ui.noSheet}
          {data.currentWeightGrams != null ? ` · ${data.currentWeightGrams} g` : ''}
        </p>
        <p className={`mt-1 text-sm ${muted}`}>
          {ui.lastCare} :{' '}
          {data.lastCareAt ? new Date(data.lastCareAt).toLocaleDateString(dateLocale) : '—'}
          {data.lastTechnicianName ? ` · ${data.lastTechnicianName}` : ''}
        </p>
        {variant === 'pro' && data.history[0]?.remainingIssues ? (
          <p className={`mt-2 text-sm ${muted}`}>
            {ui.knownIssues} : {data.history[0].remainingIssues}
          </p>
        ) : null}
      </section>

      {data.latestAdvice ? (
        <section className={card}>
          <h2 className={`font-display text-2xl ${title}`}>{ui.expertAdvice}</h2>
          <ul className={`mt-3 space-y-1 text-sm ${muted}`}>
            {data.latestAdvice.washFrequency ? <li>{ui.wash} : {data.latestAdvice.washFrequency}</li> : null}
            {data.latestAdvice.recommendedProducts ? (
              <li>{ui.products} : {data.latestAdvice.recommendedProducts}</li>
            ) : null}
            {data.latestAdvice.productsToAvoid ? <li>{ui.toAvoid} : {data.latestAdvice.productsToAvoid}</li> : null}
            {data.latestAdvice.stylingAdvice ? <li>{ui.styling} : {data.latestAdvice.stylingAdvice}</li> : null}
            {data.latestAdvice.storageAdvice ? <li>{ui.storage} : {data.latestAdvice.storageAdvice}</li> : null}
            {data.latestAdvice.heatAdvice ? <li>{ui.heat} : {data.latestAdvice.heatAdvice}</li> : null}
            {data.latestAdvice.laceAdvice ? <li>{ui.laceAdvice} : {data.latestAdvice.laceAdvice}</li> : null}
            {data.latestAdvice.otherAdvice ? <li>{data.latestAdvice.otherAdvice}</li> : null}
            {data.latestAdvice.nextCareAt ? (
              <li>{ui.nextCare} : {new Date(data.latestAdvice.nextCareAt).toLocaleDateString(dateLocale)}</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className={card}>
        <h2 className={`font-display text-2xl ${title}`}>{ui.careHistory}</h2>
        {data.history.length === 0 ? (
          <p className={`mt-2 ${muted}`}>{ui.noHistory}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.history.map((item) => (
              <li key={item.id} className={`border-t ${dark ? 'border-white/10' : 'border-ink/10'} pt-4`}>
                <p className={title}>
                  {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString(dateLocale) : '—'}{' '}
                  — {item.operations.map((o) => careLabel(locale, o.code)).join(' + ') || ui.care}
                </p>
                <p className={`text-sm ${muted}`}>
                  {ui.before} : {item.beforeGeneralCondition ? careLabel(locale, item.beforeGeneralCondition) : '—'}
                  {item.beforeWeightGrams != null ? ` · ${item.beforeWeightGrams} g` : ''}
                </p>
                <p className={`text-sm ${muted}`}>
                  {ui.after} : {item.afterGeneralCondition ? careLabel(locale, item.afterGeneralCondition) : '—'}
                  {item.afterWeightGrams != null ? ` · ${item.afterWeightGrams} g` : ''}
                  {item.weightDeltaGrams != null
                    ? ` · ${item.weightDeltaGrams > 0 ? '+' : ''}${item.weightDeltaGrams} g`
                    : ''}
                </p>
                <p className={`text-sm ${muted}`}>
                  {ui.hairAdded} : {item.hairAdded ? t.common.yes : t.common.no} · {ui.expert} : {item.technicianDisplayName}
                </p>
                {variant === 'pro' && item.remainingIssues ? (
                  <p className={`text-sm ${muted}`}>{ui.watch} : {item.remainingIssues}</p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE'].map((angle) => {
                    const before = item.photos.find((p) => p.phase === 'BEFORE' && p.angle === angle && p.url);
                    const after = item.photos.find((p) => p.phase === 'AFTER' && p.angle === angle && p.url);
                    if (!before && !after) return null;
                    return (
                      <div key={`${item.id}-${angle}`}>
                        <p className={`mb-1 text-xs ${muted}`}>
                          {careLabel(locale, angle)} · {ui.beforeAfter}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {before?.url ? (
                            <img src={before.url} alt="" className="h-20 w-full rounded object-cover" />
                          ) : (
                            <div className="h-20 rounded bg-black/10" />
                          )}
                          {after?.url ? (
                            <img src={after.url} alt="" className="h-20 w-full rounded object-cover" />
                          ) : (
                            <div className="h-20 rounded bg-black/10" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {item.photos
                    .filter((p) => p.angle === 'EXTRA' && p.url)
                    .map((p) => (
                      <div key={p.id}>
                        <p className={`mb-1 text-xs ${muted}`}>
                          {p.phase === 'BEFORE' ? ui.before : ui.after} · {ui.extra}
                        </p>
                        <img src={p.url!} alt="" className="h-20 w-full rounded object-cover" />
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
