'use client';

type Point = { label: string; value: number };

export function SparkArea({
  points,
  color = '#e8b4a2',
  height = 160,
}: {
  points: Point[];
  color?: string;
  height?: number;
}) {
  const width = 560;
  const padX = 8;
  const padY = 12;
  const max = Math.max(...points.map((p) => p.value), 1);
  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (i / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - (p.value / max) * (height - padY * 2);
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1]?.x ?? 0} ${height - padY} L ${coords[0]?.x ?? 0} ${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Courbe">
      <path d={area} fill={color} opacity={0.18} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r={3} fill={color} />
      ))}
    </svg>
  );
}
