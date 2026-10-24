import { getInitials } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

const sizes = { sm: 'size-8 text-label-sm', md: 'size-10 text-label-md', lg: 'size-14 text-title-sm' } as const;

/** Initials on a soft navy tile; the name is announced by the surrounding text, not the avatar. */
export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
