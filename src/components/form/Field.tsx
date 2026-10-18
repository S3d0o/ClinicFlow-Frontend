import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
  /** id of the control; the label, hint and error are wired to it */
  id: string;
  label: ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Label + control + hint/error. Passes `id`, `aria-describedby` and `aria-invalid` to the single
 * child control so screen readers announce the hint and error with the field.
 */
export function Field({ id, label, required, optional, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="gap-1 text-label-md text-foreground">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="font-normal tracking-normal text-muted-foreground">(optional)</span>}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-body-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-body-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** A labelled group of fields inside a form. */
export function FieldGroup({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      <div>
        <legend className="font-display text-title-sm text-foreground">{title}</legend>
        {description && <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}
