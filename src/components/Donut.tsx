/**
 * Multi-slice donut chart (SVG, no external library).
 * Used for the Compliance distribution on the Dashboard and the
 * Compliance page header.
 */
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  slices: DonutSlice[];
  /** Big number rendered in the center (defaults to the first slice's percentage). */
  centerValue?: string;
  /** Small uppercase label under the center number. */
  centerLabel?: string;
  size?: number;
  thickness?: number;
}

export default function Donut({
  slices,
  centerValue,
  centerLabel,
  size = 160,
  thickness = 22,
}: DonutProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - thickness / 2 - 2;
  const c = 2 * Math.PI * r;

  // Precompute dash lengths and their cumulative offsets — no mutable state
  // during render, so the react-hooks purity lint is happy.
  const dashes = slices.map(s => (total > 0 ? (s.value / total) * c : 0));
  const offsets = dashes.reduce<number[]>((acc, _d, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + dashes[i - 1]);
    return acc;
  }, []);

  // Default center: percentage of the first slice (e.g. % compliant)
  const computedCenter =
    centerValue ??
    (total > 0 && slices.length > 0
      ? `${Math.round((slices[0].value / total) * 100)}%`
      : undefined);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
        {/* Track */}
        <circle r={r} fill="none" stroke="#F0F5F3" strokeWidth={thickness} />
        {slices.map((s, i) => (
          <circle
            key={i}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dashes[i]} ${c}`}
            strokeDashoffset={-offsets[i]}
          />
        ))}
      </g>
      {computedCenter && (
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          fontFamily="Inter"
          fontWeight={800}
          fontSize={28}
          fill="#04363B"
          className="tabular-nums"
        >
          {computedCenter}
        </text>
      )}
      {centerLabel && (
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize={9}
          fill="#667A7E"
          letterSpacing={1.5}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
