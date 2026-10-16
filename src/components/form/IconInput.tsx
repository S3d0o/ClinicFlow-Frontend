import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Input with a decorative leading icon. Props (including the `id`/aria from `Field`) go to the input. */
export function IconInput({ icon: Icon, className, ...props }: ComponentProps<'input'> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input className={cn('pl-10', className)} {...props} />
    </div>
  );
}
