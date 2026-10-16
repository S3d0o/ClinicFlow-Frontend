import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roleStyles: Record<UserRole, string> = {
  Doctor: 'border-ink bg-ink text-ink-foreground',
  Patient: 'border-info/20 bg-info/10 text-info',
  Admin: 'border-violet/20 bg-violet/10 text-violet',
};

/** Pill showing an account role (Doctor: slate, Patient: cyan, Admin: violet). */
export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-label-sm', roleStyles[role], className)}>
      {role}
    </span>
  );
}
