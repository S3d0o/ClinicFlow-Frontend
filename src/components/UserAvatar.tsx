import { useState } from 'react';
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
  /** Profile picture; falls back to initials when missing or when it fails to load */
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

/** Initials (or photo) avatar. Decorative: the name is always shown next to it, so it's hidden from screen readers. */
export function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold tracking-wide text-secondary-foreground',
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
