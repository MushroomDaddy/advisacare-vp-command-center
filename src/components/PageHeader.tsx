/**
 * Editorial page header — eyebrow → title (Fraunces serif) → sub copy.
 * Use at the top of every page so headings carry presence and the
 * "command center" register reads consistently across the app.
 */
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Small mono eyebrow above the title. Optional. */
  eyebrow?: ReactNode;
  /** Main page title — rendered in Fraunces serif via .page-title. */
  title: ReactNode;
  /** One-line subtitle / context line under the title. Optional. */
  subtitle?: ReactNode;
  /** Right-aligned slot for primary action buttons. Optional. */
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="eyebrow mb-2" data-testid="page-eyebrow">
            {eyebrow}
          </div>
        )}
        <h2 className="page-title" data-testid="page-title">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-advisa-text-muted mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
