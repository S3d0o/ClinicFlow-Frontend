import { CalendarCheck, CheckCircle2, CircleDashed, UserX, XCircle, type LucideIcon } from 'lucide-react';
import type { AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusStyles: Record<AppointmentStatus, { label: string; icon: LucideIcon; className: string }> = {
  Confirmed: { label: 'Confirmed', icon: CalendarCheck, className: 'bg-primary/[0.08] text-primary ring-primary/20' },
  Completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-success/10 text-success ring-success/20' },
  Cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-destructive/[0.08] text-destructive ring-destructive/20' },
  Pending: { label: 'Pending', icon: CircleDashed, className: 'bg-warning/10 text-warning ring-warning/20' },
  NoShow: { label: 'No-show', icon: UserX, className: 'bg-muted text-muted-foreground ring-border' },
};

/** Appointment status: icon + text, so the state never depends on color alone. */
export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const style = statusStyles[status] ?? statusStyles.Pending;
  const Icon = style.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        style.className,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {style.label}
    </span>
  );
}
