import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/UserAvatar';
import { RoleBadge } from '@/components/RoleBadge';
import { NotificationsMenu } from '@/components/shell/NotificationsMenu';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { navByRole, notificationsNavItem, profileNavByRole, workspaceLabelByRole, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

function SidebarLink({ item, badge, onNavigate }: { item: NavItem; badge?: number; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-md transition-colors',
          isActive
            ? 'bg-sidebar-accent font-bold text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-secondary/70 hover:text-foreground'
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
          {badge > 9 ? '9+' : badge}
          <span className="sr-only"> unread</span>
        </span>
      )}
    </NavLink>
  );
}

interface SidebarContentProps {
  role: UserRole;
  displayName: string;
  pictureUrl?: string;
  unreadCount: number;
  onNavigate?: () => void;
  onSignOut: () => void;
}

/** Logo, role navigation, account links and the signed-in user card. Shared by the desktop rail and the mobile sheet. */
function SidebarContent({ role, displayName, pictureUrl, unreadCount, onNavigate, onSignOut }: SidebarContentProps) {
  const profile = profileNavByRole[role];
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <Logo />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 scrollbar-thin">
        <div className="space-y-1">
          {navByRole[role].map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="eyebrow px-3 pb-1">Account</p>
          <SidebarLink item={notificationsNavItem} badge={unreadCount} onNavigate={onNavigate} />
          {profile && <SidebarLink item={profile} onNavigate={onNavigate} />}
        </div>
      </nav>
      <div className="p-3">
        <div className="rounded-xl bg-accent p-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={displayName} src={pictureUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-md text-foreground">{displayName}</p>
              <RoleBadge role={role} className="mt-1" />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={onSignOut}>
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Signed-in layout: fixed sidebar on large screens (a sheet on smaller ones) and a slim top bar. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, userName, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unread, markAllRead, markRead } = useUnreadNotifications(true);

  if (!role) return null;

  const displayName = user ? `${user.firstName} ${user.lastName}` : userName || 'Account';
  const pictureUrl = user?.profilePictureUrl;
  const profile = profileNavByRole[role];
  const sidebarProps = { role, displayName, pictureUrl, unreadCount: unread.length, onSignOut: () => logout() };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar border-r border-border/60 bg-sidebar lg:block">
        <SidebarContent {...sidebarProps} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs gap-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <SidebarContent
            {...sidebarProps}
            onNavigate={() => setMobileOpen(false)}
            onSignOut={() => {
              setMobileOpen(false);
              logout();
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-sidebar">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <Logo className="lg:hidden" />
            <div className="hidden items-center gap-3 lg:flex">
              <span className="font-display text-title-sm text-foreground">{workspaceLabelByRole[role]}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-label-sm uppercase tracking-wider text-secondary-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {role}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <NotificationsMenu role={role} unread={unread} onMarkAllRead={markAllRead} onMarkRead={markRead} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 gap-2.5 pl-2 pr-2 text-foreground" aria-label={`Account menu for ${displayName}`}>
                    <span className="hidden text-right leading-tight sm:block">
                      <span className="block max-w-[10rem] truncate text-label-md">{displayName}</span>
                      <span className="block text-caption font-normal text-muted-foreground">{role}</span>
                    </span>
                    <UserAvatar name={displayName} src={pictureUrl} size="sm" />
                    <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    {user?.email && <p className="truncate text-body-sm text-muted-foreground">{user.email}</p>}
                    <RoleBadge role={role} className="mt-2" />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profile && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={profile.to}><profile.icon aria-hidden="true" /> Profile</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/notifications"><Bell aria-hidden="true" /> Notifications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={() => logout()}>
                    <LogOut aria-hidden="true" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>

        <footer className="px-4 pb-6 pt-2 text-body-sm text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} ClinicFlow
        </footer>
      </div>
    </div>
  );
}
