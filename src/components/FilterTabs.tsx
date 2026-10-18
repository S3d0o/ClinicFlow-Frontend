import { cn } from '@/lib/utils';

interface FilterTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  /** `count` renders next to the label, e.g. "Pending (3)" */
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}

/** Segmented filter control (a group of toggle buttons; the active one has aria-pressed). */
export function FilterTabs<T extends string>({ value, onChange, options, label, className }: FilterTabsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex max-w-full overflow-x-auto rounded-xl bg-muted p-1 scrollbar-thin', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-label-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular-nums', active ? 'text-muted-foreground' : 'text-muted-foreground/80')}>({o.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
