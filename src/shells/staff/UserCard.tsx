import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { primaryRoleLabel } from '@/features/auth/model/display';
import type { CurrentUser } from '@/features/auth/model/user';
import { useSignOutAndLeave } from '@/features/auth/hooks/use-sign-out-and-leave';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';

/** The signed-in staff member at the bottom of the sidebar, with sign-out. */
export function UserCard({ user }: { user: CurrentUser }) {
  const { t } = useTranslation();
  const { signOut, isPending } = useSignOutAndLeave();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <Avatar name={user.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-md text-foreground">{user.fullName}</p>
        <p className="truncate text-caption text-muted-foreground">{t(`roles.${primaryRoleLabel(user)}`)}</p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={t('actions.signOut')} onClick={signOut} disabled={isPending}>
        <LogOut className="rtl-flip" />
      </Button>
    </div>
  );
}
