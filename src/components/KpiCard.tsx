/**
 * v2 KPI card — large numeral, mono label, accent rail on the left,
 * an inline sparkline, and a percentage delta. Replaces the v1 stat-card
 * for the Dashboard hero row.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import Sparkline from './Sparkline';

type Tone = 'neutral' | 'critical' | 'warning' | 'success';

interface KpiCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
  /** Trend data for the sparkline. Optional. */
  trend?: number[];
  /** Optional footer slot (delta, sub-label, etc.) */
  foot?: ReactNode;
  /** Click handler — turns the card into a button that navigates. */
  onClick?: () => void;
  /** Optional data-testid. */
  testId?: string;
}

const toneStyles: Record<Tone, { rail: string; spark: string; value: string }> = {
  neutral:  { rail: '#06494F', spark: '#06494F', value: 'text-advisa-secondary' },
  critical: { rail: '#DC2626', spark: '#DC2626', value: 'text-op-critical' },
  warning:  { rail: '#D97706', spark: '#D97706', value: 'text-op-warning' },
  success:  { rail: '#9BB83F', spark: '#9BB83F', value: 'text-[#4F6A1A]' },
};

export default function KpiCard({
  label,
  value,
  tone = 'neutral',
  trend,
  foot,
  onClick,
  testId,
}: KpiCardProps) {
  const t = toneStyles[tone];
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={testId}
      className={clsx(
        'relative bg-advisa-card rounded-card border border-advisa-border shadow-card p-5 pt-5 pl-6 overflow-hidden transition-all duration-150',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover'
      )}
    >
      {/* Left accent rail */}
      <span
        aria-hidden
        className="absolute top-0 left-0 h-full w-1"
        style={{ background: t.rail }}
      />
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-advisa-text-muted">
        {label}
      </p>
      <p className={clsx('font-extrabold text-[34px] leading-none tracking-tight mt-1.5 tabular-nums', t.value)}>
        {value}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="text-[11px] text-advisa-text-muted min-h-[14px]">{foot}</div>
        {trend && trend.length > 0 && (
          <Sparkline data={trend} color={t.spark} label={`${label} trend`} />
        )}
      </div>
    </div>
  );
}
