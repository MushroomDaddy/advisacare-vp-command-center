/**
 * Horizontal funnel chart for showing pipeline distribution. Pure SVG-free
 * HTML — each row is a label + bar + numeric count. The final row uses the
 * lime accent so the positive outcome ("Started") visually pops.
 */
interface FunnelRow {
  label: string;
  count: number;
  /** Optional emphasis flag (renders the bar in lime instead of teal). */
  emphasis?: boolean;
}

interface FunnelProps {
  rows: FunnelRow[];
  /** Optional overall total used to scale bars. Defaults to max(count). */
  total?: number;
}

export default function Funnel({ rows, total }: FunnelProps) {
  if (rows.length === 0) return null;
  const denom = Math.max(total ?? Math.max(...rows.map(r => r.count)), 1);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const pct = (r.count / denom) * 100;
        const bg = r.emphasis
          ? 'linear-gradient(90deg, #9BB83F 0%, #86A832 100%)'
          : 'linear-gradient(90deg, #06494F 0%, #0B5F66 100%)';
        return (
          <div
            key={r.label}
            className="grid grid-cols-[90px_1fr_50px] items-center gap-2.5 text-[12.5px]"
          >
            <span className="text-advisa-text font-medium">{r.label}</span>
            <div className="h-4 bg-[#EAF0EE] rounded overflow-hidden">
              <div
                className="h-full rounded flex items-center justify-end pr-2 text-white text-[10px] font-semibold tabular-nums"
                style={{ width: `${Math.max(pct, 4)}%`, background: bg }}
              >
                {r.count > 0 && r.count}
              </div>
            </div>
            <span className="text-right font-semibold text-advisa-secondary tabular-nums">
              {r.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
