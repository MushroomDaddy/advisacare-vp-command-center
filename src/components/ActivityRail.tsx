/**
 * Activity rail for the Dashboard — a vertical list of recent operational
 * events with colour-coded dots and JetBrains Mono timestamps. Reads as
 * "command center event feed" rather than a generic audit log table.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type ActivityTone = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

export interface ActivityEntry {
  id: string;
  /** Short ISO time string or "HH:MM" — rendered in mono. */
  time: string;
  tone?: ActivityTone;
  /** Main text. Free-form ReactNode so you can <strong> the subject. */
  text: ReactNode;
}

const toneColor: Record<ActivityTone, string> = {
  critical: '#DC2626',
  warning:  '#D97706',
  success:  '#9BB83F',
  info:     '#1597C8',
  neutral:  '#93A6A8',
};

interface ActivityRailProps {
  items: ActivityEntry[];
  emptyText?: string;
}

export default function ActivityRail({ items, emptyText = 'No recent activity' }: ActivityRailProps) {
  if (items.length === 0) {
    return (
      <p className="text-center py-6 text-xs text-advisa-text-muted">{emptyText}</p>
    );
  }
  return (
    <div className="space-y-0">
      {items.map((item, idx) => {
        const tone: ActivityTone = item.tone ?? 'neutral';
        return (
          <div
            key={item.id}
            className={clsx(
              'grid grid-cols-[14px_1fr_auto] gap-3 items-start py-3',
              idx > 0 && 'border-t border-advisa-border'
            )}
          >
            <span
              className="w-2 h-2 rounded-full mt-1.5"
              style={{
                background: toneColor[tone],
                boxShadow: tone === 'critical' ? '0 0 0 3px rgba(220,38,38,0.12)' : undefined,
              }}
              aria-hidden
            />
            <div className="text-[12.5px] text-advisa-text leading-snug">{item.text}</div>
            <span className="font-mono text-[10px] text-advisa-text-muted tabular-nums flex-shrink-0">
              {item.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}
