'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, Popup, type MapRef } from 'react-map-gl/maplibre';
import { StarRating } from '@/components/reviews/star-rating';
import { MapPin, PealunaMap } from './pealuna-map';

export type MapTechnician = {
  id: string;
  displayName: string;
  headline: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  reviewCount?: number;
  selected?: boolean;
};

const TEL_AVIV = { latitude: 32.0853, longitude: 34.7818 };

export function ExpertsMap({
  technicians,
  onSelect,
  className,
  center,
  userPosition,
}: {
  technicians: MapTechnician[];
  onSelect?: (id: string) => void;
  className?: string;
  center?: [number, number];
  userPosition?: [number, number] | null;
}) {
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [popupId, setPopupId] = useState<string | null>(null);

  const withCoords = useMemo(
    () =>
      technicians.filter(
        (t): t is MapTechnician & { latitude: number; longitude: number } =>
          t.latitude != null && t.longitude != null,
      ),
    [technicians],
  );

  const points = useMemo(() => {
    const next = withCoords.map((t) => ({ lat: t.latitude, lng: t.longitude }));
    if (userPosition) next.push({ lat: userPosition[0], lng: userPosition[1] });
    return next;
  }, [withCoords, userPosition]);

  const initial = center
    ? { latitude: center[0], longitude: center[1], zoom: 12 }
    : userPosition
      ? { latitude: userPosition[0], longitude: userPosition[1], zoom: 12 }
      : { ...TEL_AVIV, zoom: 11 };

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    if (points.length === 0) {
      map.jumpTo({ center: [TEL_AVIV.longitude, TEL_AVIV.latitude], zoom: 11 });
      return;
    }
    if (points.length === 1) {
      map.jumpTo({ center: [points[0]!.lng, points[0]!.lat], zoom: 13 });
      return;
    }
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, duration: 0 },
    );
  }, [points, ready]);

  const popup = withCoords.find((t) => t.id === popupId);

  return (
    <PealunaMap
      mapRef={mapRef}
      className={className ?? 'h-80 overflow-hidden rounded-xl'}
      initialViewState={initial}
      onReady={() => setReady(true)}
    >
      {userPosition ? (
        <Marker longitude={userPosition[1]} latitude={userPosition[0]} anchor="center">
          <span className="block h-3.5 w-3.5 rounded-full border-2 border-ink bg-[#e8b4a2] shadow" />
        </Marker>
      ) : null}
      {withCoords.map((t) => (
        <Marker
          key={t.id}
          longitude={t.longitude}
          latitude={t.latitude}
          anchor="bottom"
          onClick={(event) => {
            event.originalEvent.stopPropagation();
            setPopupId(t.id);
            onSelect?.(t.id);
          }}
        >
          <button type="button" className="cursor-pointer bg-transparent p-0" aria-label={t.displayName}>
            <MapPin selected={t.selected} />
          </button>
        </Marker>
      ))}
      {popup ? (
        <Popup
          longitude={popup.longitude}
          latitude={popup.latitude}
          anchor="bottom"
          offset={36}
          onClose={() => setPopupId(null)}
          closeButton={false}
          className="pealuna-map-popup"
        >
          <p className="font-medium text-ink">{popup.displayName}</p>
          {popup.headline ? <p className="text-xs text-muted">{popup.headline}</p> : null}
          {popup.reviewCount ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
              <StarRating value={popup.ratingAvg} />
              <span className="tabular-nums">{popup.ratingAvg.toFixed(1)}</span>
            </p>
          ) : null}
        </Popup>
      ) : null}
    </PealunaMap>
  );
}
