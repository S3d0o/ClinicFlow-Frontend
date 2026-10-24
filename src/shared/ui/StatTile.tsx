import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  /** Context under the value, e.g. "median wait 18 min". */
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** A KPI tile: label, big number, short context. */
export function StatTile({ label, value, hint, icon, className }: StatTileProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-label-md text-muted-foreground">{label}</p>
        {icon && (
          <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-headline-xl tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-body-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
