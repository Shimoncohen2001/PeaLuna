'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'gold' | 'primary';
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type DialogState = ConfirmOptions & { open: boolean };

const CLOSED: DialogState = { open: false, title: '' };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const titleId = useId();
  const descriptionId = useId();
  const [dialog, setDialog] = useState<DialogState>(CLOSED);
  const [mounted, setMounted] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      previousFocusRef.current =
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      setDialog({ ...options, open: true });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setDialog(CLOSED);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!dialog.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [dialog.open, close]);

  const overlay = dialog.open ? (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={dialog.cancelLabel ?? t.common.cancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={() => close(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={dialog.description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-2xl border border-ink/5 bg-warm-white p-6 text-ink shadow-elevated"
      >
        <p className="text-sm uppercase tracking-[0.18em] text-champagne">{t.brand}</p>
        <h2 id={titleId} className="mt-2 font-display text-3xl text-ink">
          {dialog.title}
        </h2>
        {dialog.description ? (
          <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">
            {dialog.description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => close(false)}
          >
            {dialog.cancelLabel ?? t.common.cancel}
          </Button>
          <Button
            type="button"
            variant={dialog.variant ?? 'gold'}
            className="w-full sm:w-auto"
            autoFocus
            onClick={() => close(true)}
          >
            {dialog.confirmLabel ?? t.common.continue}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return confirm;
}
