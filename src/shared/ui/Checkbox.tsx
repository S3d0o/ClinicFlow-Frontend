import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}

/** A native checkbox with its label (and optional hint or error), large enough to tap. */
export function Checkbox({ label, description, error, className, id, ...props }: CheckboxProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1">
        <input
          {...props}
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'mt-0.5 size-5 shrink-0 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            error && 'outline outline-1 outline-destructive'
          )}
        />
        <span className="space-y-0.5">
          <span className="block text-body-md text-foreground">{label}</span>
          {description && <span className="block text-body-sm text-muted-foreground">{description}</span>}
        </span>
      </label>
      {error && (
        <p id={errorId} className="ms-8 text-body-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
