'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapTechnician = {
  id: string;
  displayName: string;
  headline: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  selected?: boolean;
};

const pin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pinSelected = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView([32.0853, 34.7818], 11);
      return;
    }
    if (points.length === 1) {
      const only = points[0]!;
      map.setView([only.lat, only.lng], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

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
  const withCoords = technicians.filter(
    (t): t is MapTechnician & { latitude: number; longitude: number } =>
      t.latitude != null && t.longitude != null,
  );

  const points = withCoords.map((t) => ({ lat: t.latitude, lng: t.longitude }));
  if (userPosition) points.push({ lat: userPosition[0], lng: userPosition[1] });
  const mapCenter = center ?? userPosition ?? [32.0853, 34.7818];

  return (
    <div dir="ltr" className={className ?? 'h-72 w-full overflow-hidden rounded-xl'}>
      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {userPosition ? (
          <CircleMarker
            center={userPosition}
            radius={10}
            pathOptions={{ color: '#1a1214', fillColor: '#e8b4a2', fillOpacity: 0.9 }}
          />
        ) : null}
        {withCoords.map((t) => (
          <Marker
            key={t.id}
            position={[t.latitude, t.longitude]}
            icon={t.selected ? pinSelected : pin}
            eventHandlers={{
              click: () => onSelect?.(t.id),
            }}
          >
            <Popup>
              <strong>{t.displayName}</strong>
              {t.headline ? (
                <>
                  <br />
                  {t.headline}
                </>
              ) : null}
              <br />★ {t.ratingAvg.toFixed(1)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
