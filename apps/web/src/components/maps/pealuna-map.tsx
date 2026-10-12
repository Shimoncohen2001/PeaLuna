import type { StyleSpecification } from 'maplibre-gl';

function rasterStyle(tiles: string[], attribution: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
        maxzoom: 20,
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}

const CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ESRI = '© Esri';

export const MAP_STYLES = {
  light: rasterStyle(
    ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
    CARTO,
  ),
  dark: rasterStyle(['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], CARTO),
};

export const MAP_STYLES_FALLBACK = {
  light: rasterStyle(
    [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    ],
    ESRI,
  ),
  dark: rasterStyle(
    [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ],
    ESRI,
  ),
};

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
