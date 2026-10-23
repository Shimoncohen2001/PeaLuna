'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 60_000,
};

export type GeoPurpose = 'nearby' | 'address';

export type GeoRequestResult =
  | { status: 'granted'; position: GeolocationPosition }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'unavailable' };

type Gate =
  | { phase: 'closed' }
  | { phase: 'ask'; purpose: GeoPurpose }
  | { phase: 'locating'; purpose: GeoPurpose }
  | { phase: 'error'; purpose: GeoPurpose; kind: 'denied' | 'unavailable' };

function errorKind(err: GeolocationPositionError | { code?: number }): 'denied' | 'unavailable' {
  return err.code === 1 ? 'denied' : 'unavailable';
}

export function useGeolocationPrompt() {
  const { t } = useLocale();
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const [gate, setGate] = useState<Gate>({ phase: 'closed' });
  const purposeRef = useRef<GeoPurpose>('nearby');
  const resolveRef = useRef<((value: GeoRequestResult) => void) | null>(null);
  const requestingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const finish = useCallback((value: GeoRequestResult) => {
    requestingRef.current = false;
    resolveRef.current?.(value);
    resolveRef.current = null;
    setGate({ phase: 'closed' });
  }, []);

  const request = useCallback((purpose: GeoPurpose) => {
    return new Promise<GeoRequestResult>((resolve) => {
      resolveRef.current?.({ status: 'cancelled' });
      resolveRef.current = resolve;
      purposeRef.current = purpose;
      requestingRef.current = false;
      setGate({ phase: 'ask', purpose });
    });
  }, []);

  const cancelAsk = useCallback(() => {
    requestIdRef.current += 1;
    finish({ status: 'cancelled' });
  }, [finish]);

  const continueAsk = useCallback(() => {
    if (requestingRef.current) return;
    requestingRef.current = true;
    const purpose = purposeRef.current;
    const requestId = ++requestIdRef.current;
    setGate({ phase: 'locating', purpose });

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      requestingRef.current = false;
      setGate({ phase: 'error', purpose, kind: 'unavailable' });
      return;
    }

    // Must run in the same tap as Accept, otherwise some browsers drop the gesture
    // and show a separate permission UI instead of activating location.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== requestIdRef.current) return;
        finish({ status: 'granted', position });
      },
      (err) => {
        if (requestId !== requestIdRef.current) return;
        requestingRef.current = false;
        setGate({ phase: 'error', purpose, kind: errorKind(err) });
      },
      GEO_OPTIONS,
    );
  }, [finish]);

  const dismissError = useCallback(() => {
    if (gate.phase !== 'error') {
      finish({ status: 'cancelled' });
      return;
    }
    finish({ status: gate.kind });
  }, [finish, gate]);

  useEffect(() => {
    if (gate.phase === 'closed') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (gate.phase === 'ask') cancelAsk();
      else if (gate.phase === 'error') dismissError();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [cancelAsk, dismissError, gate.phase]);

  const copy =
    gate.phase === 'ask' || gate.phase === 'locating'
      ? {
          title: t.geo.askTitle,
          body:
            gate.phase === 'locating'
              ? t.geo.locating
              : gate.purpose === 'nearby'
                ? t.geo.askNearby
                : t.geo.askAddress,
        }
      : gate.phase === 'error'
        ? {
            title: gate.kind === 'denied' ? t.geo.deniedTitle : t.geo.errorTitle,
            body:
              gate.kind === 'denied'
                ? gate.purpose === 'nearby'
                  ? t.geo.deniedNearby
                  : t.geo.deniedAddress
                : gate.purpose === 'nearby'
                  ? t.geo.unavailableNearby
                  : t.geo.unavailableAddress,
          }
        : null;

  const overlay: ReactNode =
    mounted && copy && gate.phase !== 'closed' ? (
      createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          {gate.phase === 'locating' ? (
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
          ) : (
            <button
              type="button"
              aria-label={t.common.cancel}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              onClick={gate.phase === 'ask' ? cancelAsk : dismissError}
            />
          )}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative w-full max-w-md rounded-2xl border border-ink/5 bg-warm-white p-6 text-ink shadow-elevated"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne/25 text-ink">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <BrandMark variant="mark" href={null} className="mt-4 h-8 sm:h-8" />
            <h2 id={titleId} className="mt-2 font-display text-3xl text-ink">
              {copy.title}
            </h2>
            <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">
              {copy.body}
            </p>
            {gate.phase === 'ask' ? (
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={cancelAsk}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  className="w-full sm:w-auto"
                  autoFocus
                  onClick={continueAsk}
                >
                  {t.geo.askContinue}
                </Button>
              </div>
            ) : gate.phase === 'locating' ? null : (
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="gold"
                  className="w-full sm:w-auto"
                  autoFocus
                  onClick={dismissError}
                >
                  {t.geo.gotIt}
                </Button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    ) : null;

  return { request, pending: gate.phase !== 'closed', dialog: overlay };
}
