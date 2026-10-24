import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Label } from './label';

/** Props a form control needs so the label, hint and error are announced with it. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Content shown at the end of the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** A labelled form control with an optional hint and error, wired together for assistive technology. */
export function Field({ label, hint, error, required, labelAside, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-label-md">
          {label}
          {required && (
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          )}
        </Label>
        {labelAside}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required || undefined })}
      {hint && !error && (
        <p id={hintId} className="text-body-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-body-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
