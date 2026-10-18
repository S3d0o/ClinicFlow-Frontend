import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  /** Small text after the value, e.g. "/ 8" or "/ 5.0" */
  suffix?: ReactNode;
  hint?: ReactNode;
  /** 0–100; draws a slim progress bar under the value */
  progress?: number;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  /** Draws attention to a metric that needs action (accent bar along the bottom edge) */
  highlight?: boolean;
  className?: string;
}

const tones = {
  default: { tile: 'bg-secondary text-secondary-foreground', value: 'text-foreground', bar: 'bg-primary', edge: 'border-b-primary' },
  success: { tile: 'bg-success/10 text-success', value: 'text-success', bar: 'bg-success', edge: 'border-b-success' },
  warning: { tile: 'bg-warning/10 text-warning', value: 'text-warning', bar: 'bg-warning', edge: 'border-b-warning' },
  destructive: { tile: 'bg-destructive/10 text-destructive', value: 'text-destructive', bar: 'bg-destructive', edge: 'border-b-destructive' },
  info: { tile: 'bg-info/10 text-info', value: 'text-foreground', bar: 'bg-info', edge: 'border-b-info' },
} as const;

/** A single dashboard metric: uppercase label, large value, optional hint or progress, and an icon tile. */
export function StatCard({ label, value, icon: Icon, suffix, hint, progress, tone = 'default', highlight = false, className }: StatCardProps) {
  const t = tones[tone];
  return (
    <Card className={cn('flex items-center justify-between gap-4 p-5', highlight && cn('border-b-[3px]', t.edge), className)}>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className={cn('font-display text-headline-xl tabular-nums', t.value)}>{value}</span>
          {suffix && <span className="text-body-sm text-muted-foreground">{suffix}</span>}
        </p>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
        {hint && <p className="mt-1 text-body-sm text-muted-foreground">{hint}</p>}
      </div>
      <span className={cn('inline-flex size-12 shrink-0 items-center justify-center rounded-xl', t.tile)}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
    </Card>
  );
}
