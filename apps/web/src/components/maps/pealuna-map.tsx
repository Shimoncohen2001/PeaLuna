'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';

function rasterStyle(tiles: string[], attribution: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}

function firstTileUrl(style: StyleSpecification): string | null {
  const source = style.sources.basemap;
  if (!source || source.type !== 'raster' || !source.tiles?.[0]) return null;
  return source.tiles[0].replace('{z}', '6').replace('{x}', '38').replace('{y}', '24');
}

function cartoTiles(path: string): string[] {
  return ['a', 'b', 'c', 'd'].map(
    (host) => `https://${host}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}@2x.png`,
  );
}

const CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ESRI = '© Esri';
const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const STYLES = {
  light: [
    rasterStyle(cartoTiles('rastertiles/voyager'), CARTO),
    rasterStyle(
      ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
      ESRI,
    ),
    rasterStyle(
      ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      OSM,
    ),
  ],
  dark: [
    rasterStyle(cartoTiles('dark_all'), CARTO),
    rasterStyle(
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      ESRI,
    ),
    rasterStyle(
      ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      OSM,
    ),
  ],
} as const;

export function MapPin({ selected = false }: { selected?: boolean }) {
  const fill = selected ? '#1a1214' : '#c9a962';
  const ring = selected ? '#c9a962' : '#1a1214';
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true" className="drop-shadow-md">
      <path
        fill={fill}
        stroke={ring}
        strokeWidth="1.25"
        d="M14 1.4c6.3 0 11.4 5 11.4 11.2 0 8.4-11.4 21.4-11.4 21.4S2.6 21 2.6 12.6C2.6 6.4 7.7 1.4 14 1.4z"
      />
      <circle cx="14" cy="12.6" r="4.2" fill="#faf8f5" />
    </svg>
  );
}

export function PealunaMap({
  tone = 'light',
  className,
  initialViewState,
  children,
  mapRef,
  onClick,
  onReady,
  scrollZoom = false,
}: {
  tone?: 'light' | 'dark';
  className?: string;
  initialViewState: { latitude: number; longitude: number; zoom: number };
  children?: ReactNode;
  mapRef?: RefObject<MapRef | null>;
  onClick?: (event: MapLayerMouseEvent) => void;
  onReady?: (map: MapRef) => void;
  scrollZoom?: boolean;
}) {
  const innerRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = mapRef ?? innerRef;
  const palette = STYLES[tone];
  const [styleIndex, setStyleIndex] = useState(0);
  const styleIndexRef = useRef(0);
  const fallbackCoolDown = useRef(false);

  function useNextStyle(fromError = false) {
    if (fromError && fallbackCoolDown.current) return;
    if (styleIndexRef.current >= palette.length - 1) return;
    if (fromError) {
      fallbackCoolDown.current = true;
      window.setTimeout(() => {
        fallbackCoolDown.current = false;
      }, 3000);
    }
    styleIndexRef.current += 1;
    setStyleIndex(styleIndexRef.current);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => ref.current?.resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    return () => ro.disconnect();
  }, [ref]);

  useEffect(() => {
    const url = firstTileUrl(palette[styleIndex] ?? palette[0]!);
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    const timer = window.setTimeout(() => {
      if (!cancelled) useNextStyle();
    }, 4000);
    img.onload = () => window.clearTimeout(timer);
    img.onerror = () => {
      window.clearTimeout(timer);
      if (!cancelled) useNextStyle();
    };
    img.src = url;
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };
  }, [palette, styleIndex]);

  return (
    <div ref={containerRef} dir="ltr" className={cn('pealuna-map', className)}>
      <Map
        ref={ref}
        initialViewState={initialViewState}
        mapStyle={palette[styleIndex]}
        scrollZoom={scrollZoom}
        dragRotate={false}
        attributionControl={{ compact: true }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onClick={onClick}
        onLoad={() => {
          const map = ref.current;
          if (!map) return;
          map.resize();
          onReady?.(map);
        }}
        onError={() => useNextStyle(true)}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {children}
      </Map>
    </div>
  );
}

export function LocationMap({
  latitude,
  longitude,
  className,
  tone = 'light',
}: {
  latitude: number;
  longitude: number;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    mapRef.current?.jumpTo({ center: [longitude, latitude], zoom: 14 });
  }, [latitude, longitude]);

  return (
    <PealunaMap
      tone={tone}
      mapRef={mapRef}
      className={className}
      initialViewState={{ latitude, longitude, zoom: 14 }}
      onReady={(map) => map.jumpTo({ center: [longitude, latitude], zoom: 14 })}
    >
      <Marker longitude={longitude} latitude={latitude} anchor="bottom">
        <MapPin />
      </Marker>
    </PealunaMap>
  );
}
