import type { AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusStyles: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  Confirmed: { label: 'Confirmed', className: 'border-success/25 bg-success/10 text-success', dot: 'bg-success' },
  Completed: { label: 'Completed', className: 'border-info/20 bg-secondary text-secondary-foreground', dot: 'bg-info' },
  Cancelled: { label: 'Cancelled', className: 'border-destructive/20 bg-destructive/[0.07] text-destructive', dot: 'bg-destructive' },
  Pending: { label: 'Pending', className: 'border-warning/25 bg-warning/10 text-warning', dot: 'bg-warning' },
  NoShow: { label: 'No-show', className: 'border-border bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

/** Appointment status chip: a status dot plus the status name, so the state never depends on color alone. */
export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const style = statusStyles[status] ?? statusStyles.Pending;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-label-sm',
        style.className,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  );
}
