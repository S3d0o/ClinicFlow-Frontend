import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const tones = {
  error: { icon: AlertCircle, classes: 'border-destructive/25 bg-destructive/10 text-destructive', role: 'alert' },
  success: { icon: CheckCircle2, classes: 'border-success/25 bg-success/10 text-success', role: 'status' },
  info: { icon: Info, classes: 'border-info/25 bg-info/10 text-info', role: 'status' },
} as const;

/** A message about the whole form (a failed submit, a sent code), announced when it appears. */
export function FormAlert({ tone = 'error', children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  const { icon: Icon, classes, role } = tones[tone];
  return (
    <div role={role} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-body-sm font-medium', classes, className)}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
