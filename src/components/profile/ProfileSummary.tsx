import { UserAvatar } from '@/components/UserAvatar';
import { RoleBadge } from '@/components/RoleBadge';
import type { UserRole } from '@/types';

/** Identity card at the top of a profile page. */
export function ProfileSummary({ name, email, role, memberSince, pictureUrl }: { name: string; email?: string; role: UserRole; memberSince?: string; pictureUrl?: string }) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <UserAvatar name={name} src={pictureUrl} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-display text-headline-md">{name}</p>
        {email && <p className="truncate text-body-md text-muted-foreground">{email}</p>}
        <p className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
          <RoleBadge role={role} />
          {memberSince && <span>Member since {memberSince}</span>}
        </p>
      </div>
    </div>
  );
}
