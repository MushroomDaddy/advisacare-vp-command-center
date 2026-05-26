/**
 * "Live · reconciled HH:MM" pulse indicator for the top command bar.
 * Tells the VP this is an operational dashboard, not a static report.
 */
import { useEffect, useState } from 'react';

interface LiveIndicatorProps {
  /** Optional ISO timestamp of the last reconciliation. Defaults to now. */
  reconciledAt?: string;
  /** Optional zone label appended after the time, e.g. "EST". */
  zone?: string;
}

function formatTime(iso: string, zone?: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return zone ? `${hh}:${mm} ${zone}` : `${hh}:${mm}`;
}

export default function LiveIndicator({ reconciledAt, zone }: LiveIndicatorProps) {
  // Re-render every 60s so the timestamp stays current while the dashboard sits open.
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force(t => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const at = reconciledAt ?? new Date().toISOString();
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium text-advisa-text-muted font-mono">
      <span className="live-dot" aria-hidden />
      <strong className="font-semibold text-advisa-text">Live</strong>
      <span>·</span>
      <span>reconciled {formatTime(at, zone)}</span>
    </div>
  );
}
