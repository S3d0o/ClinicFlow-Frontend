import { UserAvatar } from '@/components/UserAvatar';

/** Identity card at the top of a profile page. */
export function ProfileSummary({ name, email, role, memberSince }: { name: string; email?: string; role: string; memberSince?: string }) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card">
      <UserAvatar name={name} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{name}</p>
        {email && <p className="truncate text-sm text-muted-foreground">{email}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">{role}</span>
          {memberSince && <span>Member since {memberSince}</span>}
        </p>
      </div>
    </div>
  );
}
