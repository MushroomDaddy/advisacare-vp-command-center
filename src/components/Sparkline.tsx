/**
 * Tiny SVG sparkline for KPI cards. Pure SVG, no chart library required.
 *
 * Renders a smoothed polyline over the supplied data with an end-dot,
 * sized to fit the surrounding KPI card. Pass `color` to match the
 * card's accent (teal, lime, amber, red).
 */
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

export default function Sparkline({
  data,
  color = '#06494F',
  width = 80,
  height = 24,
  label,
}: SparklineProps) {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      // Invert y so higher values render higher on the chart
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = (data.length - 1) * stepX;
  const lastY = height - 2 - ((data[data.length - 1] - min) / span) * (height - 4);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? `Trend (${data.length} points)`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}
