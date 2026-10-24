import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * An Egyptian mobile number field (FR-ACC-01) with the +20 prefix shown. Accepts the local form
 * ("010 1234 5678") or the international one; `toE164EgyptianMobile` normalises it. Numbers read
 * left to right in both languages.
 */
export function PhoneInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <div
      dir="ltr"
      className={cn(
        'flex h-10 w-full overflow-hidden rounded-lg border border-input bg-card shadow-xs transition-[border-color,box-shadow]',
        'hover:border-muted-foreground/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25',
        'has-[[aria-invalid=true]]:border-destructive',
        className
      )}
    >
      <span aria-hidden="true" className="flex items-center border-e border-border bg-muted px-3 text-body-md font-medium text-muted-foreground">
        +20
      </span>
      <input
        {...props}
        type="tel"
        inputMode="tel"
        autoComplete={props.autoComplete ?? 'tel-national'}
        className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/80 md:text-sm"
      />
    </div>
  );
}
