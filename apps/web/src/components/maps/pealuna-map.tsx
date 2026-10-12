export const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
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
