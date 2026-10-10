import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/format';

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
} as const;

interface UserAvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

/** Initials avatar. Decorative: the name is always shown next to it, so it's hidden from screen readers. */
export function UserAvatar({ name, size = 'md', className }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-secondary font-semibold tracking-wide text-secondary-foreground ring-1 ring-inset ring-primary/10',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
