import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FilterChipsProps<T extends string | null | undefined> {
  /** Names the group for assistive technology. */
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A row of toggle chips where one is on (a category, a doctor, a specialty). Scrolls sideways when narrow. */
export function FilterChips<T extends string | null | undefined>({ label, options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('scrollbar-thin flex gap-2 overflow-x-auto pb-1', className)}>
      {options.map((option) => (
        <button
          key={option.value ?? 'all'}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-10 shrink-0 rounded-full border px-4 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
