'use client';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';

export function AddressConfirmCard({
  address,
  loading,
  onUse,
  onOther,
}: {
  address?: string | null;
  loading?: boolean;
  onUse?: () => void;
  onOther: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-ink/5 bg-beige/40 p-5 shadow-soft">
      <p className="text-sm uppercase tracking-[0.18em] text-champagne">{t.brand}</p>
      <h3 className="mt-2 font-display text-2xl text-ink">{t.book.recognizedTitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {loading ? t.book.lookingUpAddress : t.book.recognizedHint}
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-muted">{t.common.loading}</p>
      ) : (
        <p className="mt-3 rounded-xl bg-warm-white px-3 py-3 text-sm leading-relaxed text-ink">
          {address}
        </p>
      )}
      {!loading && onUse ? (
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onOther}>
            {t.book.anotherAddress}
          </Button>
          <Button type="button" variant="gold" className="w-full sm:w-auto" onClick={onUse}>
            {t.book.useThisAddress}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
