/**
 * Brand-correct "all clear" empty state. One reusable component so every
 * page (Referrals, Compliance, Quality, Staffing, etc.) gets the same
 * calm, confident treatment when there's nothing urgent.
 *
 *   ┌─────────────────────────────────────────────┐
 *   │             ╭───────╮                       │
 *   │             │  ✓    │   (lime gradient pip) │
 *   │             ╰───────╯                       │
 *   │   All referrals on track                    │
 *   │   No referrals match the current filter.    │
 *   │   ...                                        │
 *   └─────────────────────────────────────────────┘
 */
import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  /** One-line headline e.g. "All referrals on track" */
  title: string;
  /** Optional one or two sentence body explaining what's going on */
  body?: string;
  /** Optional call to action shown below the body */
  action?: ReactNode;
  /** Override the icon — defaults to ShieldCheck */
  icon?: ReactNode;
}

export default function PremiumEmptyState({ title, body, action, icon }: Props) {
  return (
    <div className="flex items-center justify-center py-12 px-6" role="status">
      <div className="text-center max-w-md">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, #ACCB4D 0%, #7FA02D 100%)',
            boxShadow: '0 6px 18px -2px rgba(155,184,63,.45), inset 0 1px 0 rgba(255,255,255,.30)',
          }}
          aria-hidden
        >
          {/* Glass highlight on top */}
          <span
            aria-hidden
            className="absolute top-1 left-2 right-2 h-2/5 rounded-t-full pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.30), transparent)' }}
          />
          {icon ?? <ShieldCheck size={24} className="text-white relative z-10" />}
        </div>
        <p className="text-base font-bold text-advisa-secondary tracking-tight">{title}</p>
        {body && (
          <p className="text-xs text-clinical-muted mt-2 leading-relaxed">{body}</p>
        )}
        {action && <div className="mt-4 flex items-center justify-center">{action}</div>}
      </div>
    </div>
  );
}
