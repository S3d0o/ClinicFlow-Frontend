import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Semantic tones. Each feature maps its statuses to a tone in one place (e.g. appointment statuses). */
export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'highlight' | 'primary';

const toneClasses: Record<Tone, { chip: string; dot: string }> = {
  success: { chip: 'border-success/25 bg-success/10 text-success', dot: 'bg-success' },
  warning: { chip: 'border-warning/25 bg-warning/10 text-warning', dot: 'bg-warning' },
  info: { chip: 'border-info/25 bg-info/10 text-info', dot: 'bg-info' },
  danger: { chip: 'border-destructive/25 bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  neutral: { chip: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  highlight: { chip: 'border-highlight/25 bg-highlight/10 text-highlight-strong', dot: 'bg-highlight' },
  primary: { chip: 'border-primary/20 bg-secondary text-primary', dot: 'bg-primary' },
};

/** A pill with a dot and a label, so the state never depends on color alone. */
export function StatusChip({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const classes = toneClasses[tone];
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-label-sm',
        classes.chip,
        className
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', classes.dot)} />
      {children}
    </span>
  );
}
