import type { NavGroup } from '@/app/navigation';
import type { CurrentUser } from '@/features/auth/model/user';
import { Logo } from '@/shared/ui/Logo';
import { BranchSwitcher } from './BranchSwitcher';
import { StaffNavList } from './StaffNavList';
import { UserCard } from './UserCard';

interface StaffSidebarProps {
  user: CurrentUser;
  groups: NavGroup[];
  homePath: string;
  onNavigate?: () => void;
}

/** Logo, branch, the user's menu and their card. Fixed on desktop, in a sheet on smaller screens. */
export function StaffSidebar({ user, groups, homePath, onNavigate }: StaffSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Logo to={homePath} className="px-1" />
      <BranchSwitcher />
      <div className="scrollbar-thin -mx-1 flex-1 overflow-y-auto px-1">
        <StaffNavList groups={groups} onNavigate={onNavigate} />
      </div>
      <UserCard user={user} />
    </div>
  );
}
