'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, Popup, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLES, MAP_STYLES_FALLBACK, MapPin } from './pealuna-map';

export type MapTechnician = {
  id: string;
  displayName: string;
  headline: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
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
  const [popupId, setPopupId] = useState<string | null>(null);
  const [style, setStyle] = useState(MAP_STYLES.light);
  const usedFallback = useRef(false);

  const withCoords = technicians.filter(
    (t): t is MapTechnician & { latitude: number; longitude: number } =>
      t.latitude != null && t.longitude != null,
  );

  const points = useMemo(() => {
    const next = withCoords.map((t) => ({ lat: t.latitude, lng: t.longitude }));
    if (userPosition) next.push({ lat: userPosition[0], lng: userPosition[1] });
    return next;
  }, [technicians, userPosition]);

  const initial = center
    ? { latitude: center[0], longitude: center[1], zoom: 12 }
    : userPosition
      ? { latitude: userPosition[0], longitude: userPosition[1], zoom: 12 }
      : { ...TEL_AVIV, zoom: 11 };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
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
      { padding: 40, duration: 0 },
    );
  }, [points]);

  const popup = withCoords.find((t) => t.id === popupId);

  return (
    <div dir="ltr" className={className ?? 'h-72 w-full overflow-hidden rounded-xl'}>
      <Map
        ref={mapRef}
        initialViewState={initial}
        mapStyle={style}
        scrollZoom={false}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => mapRef.current?.resize()}
        onError={() => {
          if (usedFallback.current) return;
          usedFallback.current = true;
          setStyle(MAP_STYLES_FALLBACK.light);
        }}
      >
        <NavigationControl position="top-right" showCompass={false} />
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
            <p className="text-xs text-muted">★ {popup.ratingAvg.toFixed(1)}</p>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
