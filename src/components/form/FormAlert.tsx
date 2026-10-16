import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Form-level error message (announced to screen readers) shown above a form's fields. */
export function FormAlert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-body-md text-destructive', className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
