import { visibleStaffNav } from '@/app/navigation';
import { routeAt } from '@/app/routes';
import { decideAccess } from '@/app/routes/access';
import { homePath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { ActiveBranchProvider } from '@/features/org/components/ActiveBranchProvider';
import { SkipLink } from '@/shared/ui/SkipLink';
import { ScreenOutlet } from '../ScreenOutlet';
import { StaffSidebar } from './StaffSidebar';
import { StaffTopBar } from './StaffTopBar';

/**
 * The staff workspace (design-v2 staff screens): a fixed 260px sidebar from `lg`, a top bar, and the
 * page. The menu shows only what the user's permissions allow. Rendered behind a route guard, so
 * there is always a signed-in user.
 */
export function StaffShell() {
  const { user } = useSession();
  if (!user) return null;

  const groups = visibleStaffNav(user);
  const home = homePath(user);
  const canSearchPatients = decideAccess(user, routeAt('/desk/patients').access) === 'allow';

  return (
    <ActiveBranchProvider>
      <div className="min-h-screen lg:ps-sidebar">
        <SkipLink />
        <aside className="fixed inset-y-0 start-0 z-40 hidden w-sidebar border-e border-border bg-sidebar lg:block">
          <StaffSidebar user={user} groups={groups} homePath={home} />
        </aside>
        <StaffTopBar
          canSearchPatients={canSearchPatients}
          sidebar={(close) => <StaffSidebar user={user} groups={groups} homePath={home} onNavigate={close} />}
        />
        <ScreenOutlet className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8" />
      </div>
    </ActiveBranchProvider>
  );
}
