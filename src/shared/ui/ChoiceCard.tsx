import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface ChoiceCardProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

/**
 * A radio option drawn as a card (e.g. "Text me a code" / "Email me a link"). It's a real radio
 * input, so a group of them gets arrow-key navigation for free; wrap them in a `fieldset`.
 */
export function ChoiceCard({ label, description, icon, className, ...props }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent',
        'has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:ring-1 has-[:checked]:ring-primary',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
        className
      )}
    >
      {icon && (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-label-md text-foreground">{label}</span>
        {description && <span className="block truncate text-body-sm text-muted-foreground">{description}</span>}
      </span>
      <input {...props} type="radio" className="size-5 shrink-0 accent-primary focus-visible:outline-none" />
    </label>
  );
}
