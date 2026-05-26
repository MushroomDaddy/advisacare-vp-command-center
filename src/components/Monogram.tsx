/**
 * Typographic brand mark — a styled "AC" lockup in Fraunces over a lime
 * gradient pad. Intentionally NOT a recreation of the AdvisaCare logo;
 * this is an inspired typographic mark used only inside this prototype.
 */
import { clsx } from 'clsx';

interface MonogramProps {
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export default function Monogram({ size = 'md', label = 'AdvisaCare', className }: MonogramProps) {
  return (
    <div
      className={clsx('monogram', size === 'sm' && 'monogram-sm', className)}
      aria-label={label}
      title={label}
    >
      AC
    </div>
  );
}
