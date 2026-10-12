import L from 'leaflet';

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MAP_TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const;

const pinSvg = (fill: string, ring: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
    <path fill="${fill}" stroke="${ring}" stroke-width="1.25" d="M14 1.4c6.3 0 11.4 5 11.4 11.2 0 8.4-11.4 21.4-11.4 21.4S2.6 21 2.6 12.6C2.6 6.4 7.7 1.4 14 1.4z"/>
    <circle cx="14" cy="12.6" r="4.2" fill="#faf8f5"/>
  </svg>`;

function pinIcon(fill: string, ring: string) {
  return L.divIcon({
    className: 'pealuna-map-pin',
    html: pinSvg(fill, ring),
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}

export const mapPin = pinIcon('#c9a962', '#1a1214');
export const mapPinSelected = pinIcon('#1a1214', '#c9a962');
