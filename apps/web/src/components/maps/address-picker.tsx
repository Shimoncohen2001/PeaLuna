'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoSuggestionDto } from '@velure/contracts';
import { ApiClientError } from '@/lib/api-client';

const pin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function MapClicks({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function AddressPicker({
  value,
  onChange,
  authFetch,
  labels,
  tone = 'light',
}: AddressPickerProps) {
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

  async function applyCoords(lat: number, lng: number, fallbackLabel?: string) {
    setBusy(true);
    try {
      const item = await authFetch<GeoSuggestionDto | null>(
        `/api/v1/geo/reverse?lat=${lat}&lon=${lng}`,
      );
      skipSearch.current = true;
      onChange({
        label: item?.label ?? fallbackLabel ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: item?.city ?? value.city,
        postalCode: item?.postalCode ?? value.postalCode,
        lat,
        lng,
      });
      setHint(null);
    } catch (err) {
      onChange({ ...value, lat, lng, label: fallbackLabel ?? value.label });
      setHint(err instanceof ApiClientError ? err.message : labels.unavailable);
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setHint(labels.unavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setHint(err.code === err.PERMISSION_DENIED ? labels.denied : labels.unavailable);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  const lat = value.lat ?? TEL_AVIV[0];
  const lng = value.lng ?? TEL_AVIV[1];

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

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={useMyLocation} disabled={busy}>
          {labels.useLocation}
        </button>
        <p className={`self-center text-xs ${muted}`}>{labels.pickOnMap}</p>
      </div>
      {hint ? <p className={`text-sm ${muted}`}>{hint}</p> : null}

      <div dir="ltr" className="h-56 overflow-hidden rounded-xl border border-ink/10">
        <MapContainer center={[lat, lng]} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lng={lng} />
          <MapClicks onPick={(nextLat, nextLng) => void applyCoords(nextLat, nextLng)} />
          <Marker
            position={[lat, lng]}
            icon={pin}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const next = event.target.getLatLng();
                void applyCoords(next.lat, next.lng);
              },
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
