'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, type MapRef } from 'react-map-gl/maplibre';
import type { GeoSuggestionDto } from '@velure/contracts';
import { useGeolocationPrompt } from '@/components/geo/location-permission';
import { ApiClientError } from '@/lib/api-client';
import { useLocale } from '@/lib/i18n/locale';
import { MapPin, PealunaMap } from './pealuna-map';

const TEL_AVIV: [number, number] = [32.0853, 34.7818];

export type AddressValue = {
  label: string;
  city: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
};

type AddressPickerProps = {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
  labels: {
    search: string;
    noResults: string;
    pickOnMap: string;
    useLocation: string;
    denied: string;
    unavailable: string;
  };
  tone?: 'light' | 'dark';
  showMap?: boolean;
  showLocate?: boolean;
};

export function AddressPicker({
  value,
  onChange,
  authFetch,
  labels,
  tone = 'light',
  showMap = true,
  showLocate = true,
}: AddressPickerProps) {
  const { t } = useLocale();
  const geoPrompt = useGeolocationPrompt();
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState(value.label);
  const [hints, setHints] = useState<GeoSuggestionDto[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const skipSearch = useRef(false);

  const inputClass =
    tone === 'dark'
      ? 'mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2'
      : 'mt-1 w-full rounded-lg border border-ink/10 px-3 py-2';
  const menuClass =
    tone === 'dark'
      ? 'absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1214] text-sm'
      : 'absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-warm-white text-sm';
  const muted = tone === 'dark' ? 'text-white/50' : 'text-muted';
  const btn =
    tone === 'dark'
      ? 'rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80'
      : 'rounded-full border border-ink/10 px-3 py-1.5 text-sm text-muted';

  useEffect(() => {
    setQuery(value.label);
  }, [value.label]);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setHints([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const items = await authFetch<GeoSuggestionDto[]>(
            `/api/v1/geo/autocomplete?q=${encodeURIComponent(q)}`,
          );
          setHints(items);
          setOpen(true);
          setHint(items.length === 0 ? labels.noResults : null);
        } catch (err) {
          setHints([]);
          setHint(err instanceof ApiClientError ? err.message : labels.unavailable);
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  }, [authFetch, labels.noResults, labels.unavailable, query]);

  const lat = value.lat ?? TEL_AVIV[0];
  const lng = value.lng ?? TEL_AVIV[1];

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.jumpTo({ center: [lng, lat], zoom: 15 });
  }, [lat, lng, ready]);

  function applySuggestion(item: GeoSuggestionDto) {
    skipSearch.current = true;
    setOpen(false);
    setHints([]);
    setQuery(item.label);
    onChange({
      label: item.label,
      city: item.city ?? value.city,
      postalCode: item.postalCode ?? value.postalCode,
      lat: item.lat,
      lng: item.lng,
    });
  }

  async function applyCoords(nextLat: number, nextLng: number, fallbackLabel?: string) {
    setBusy(true);
    try {
      const item = await authFetch<GeoSuggestionDto | null>(
        `/api/v1/geo/reverse?lat=${nextLat}&lon=${nextLng}`,
      );
      skipSearch.current = true;
      onChange({
        label: item?.label ?? fallbackLabel ?? `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`,
        city: item?.city ?? value.city,
        postalCode: item?.postalCode ?? value.postalCode,
        lat: nextLat,
        lng: nextLng,
      });
      setHint(null);
    } catch (err) {
      onChange({ ...value, lat: nextLat, lng: nextLng, label: fallbackLabel ?? value.label });
      setHint(err instanceof ApiClientError ? err.message : labels.unavailable);
    } finally {
      setBusy(false);
    }
  }

  async function locateFromDevice() {
    const result = await geoPrompt.request('address');
    if (result.status === 'granted') {
      void applyCoords(result.position.coords.latitude, result.position.coords.longitude);
      return;
    }
    if (result.status === 'cancelled') return;
    setHint(result.status === 'denied' ? t.geo.deniedAddress : t.geo.unavailableAddress);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className={`text-sm ${tone === 'dark' ? 'text-white/70' : 'font-medium'}`}>
          {labels.search}
        </label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...value, label: e.target.value });
          }}
          onFocus={() => hints.length > 0 && setOpen(true)}
          className={inputClass}
          autoComplete="off"
        />
        {open && hints.length > 0 ? (
          <ul className={menuClass}>
            {hints.map((item) => (
              <li key={`${item.lat}-${item.lng}-${item.label}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-champagne/20"
                  onClick={() => applySuggestion(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {showLocate || showMap ? (
        <div className="flex flex-wrap gap-2">
          {showLocate ? (
            <button
              type="button"
              className={btn}
              onClick={() => void locateFromDevice()}
              disabled={busy || geoPrompt.pending}
            >
              {geoPrompt.pending ? t.geo.locating : labels.useLocation}
            </button>
          ) : null}
          {showMap ? <p className={`self-center text-xs ${muted}`}>{labels.pickOnMap}</p> : null}
        </div>
      ) : null}
      {hint ? <p className={`text-sm ${muted}`}>{hint}</p> : null}
      {geoPrompt.dialog}

      {showMap ? (
        <PealunaMap
          tone={tone}
          mapRef={mapRef}
          className={`h-64 overflow-hidden rounded-xl border ${tone === 'dark' ? 'border-white/10' : 'border-ink/10'}`}
          initialViewState={{ latitude: lat, longitude: lng, zoom: 13 }}
          onReady={() => setReady(true)}
          onClick={(event) => {
            if (event.lngLat) void applyCoords(event.lngLat.lat, event.lngLat.lng);
          }}
        >
          <Marker
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            draggable
            onDragEnd={(event) => {
              void applyCoords(event.lngLat.lat, event.lngLat.lng);
            }}
          >
            <MapPin />
          </Marker>
        </PealunaMap>
      ) : null}
    </div>
  );
}
