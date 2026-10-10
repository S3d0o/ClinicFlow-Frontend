import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/UserAvatar';
import { notificationsApi } from '@/api';
import { formatTimeAgo } from '@/lib/format';
import { NOTIFICATIONS_CHANGED_EVENT, notifyNotificationsChanged } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import type { Notification, UserRole } from '@/types';

const NOTIFICATION_POLL_MS = 60_000;

interface NavItem { label: string; to: string }

// Primary navigation per role (signed-out visitors get the first entry)
const navByRole: Record<UserRole | 'Guest', NavItem[]> = {
  Guest: [{ label: 'Find doctors', to: '/doctors' }],
  Patient: [
    { label: 'Find doctors', to: '/doctors' },
    { label: 'Appointments', to: '/patient/appointments' },
  ],
  Doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', to: '/doctor/appointments' },
    { label: 'Schedule', to: '/doctor/schedules' },
  ],
  Admin: [
    { label: 'Overview', to: '/admin/dashboard' },
    { label: 'Doctor approvals', to: '/admin/pending-doctors' },
    { label: 'Specialties', to: '/admin/specialties' },
  ],
};

const profileRouteByRole: Partial<Record<UserRole, string>> = {
  Patient: '/patient/profile',
  Doctor: '/doctor/profile',
};

const appointmentsRouteByRole: Partial<Record<UserRole, string>> = {
  Patient: '/patient/appointments',
  Doctor: '/doctor/appointments',
};

export function Navbar() {
  const { user, role, userName, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState<Notification[]>([]);

  const fetchUnread = useCallback(() => {
    if (!isAuthenticated) return;
    notificationsApi
      .getMyNotifications(true)
      .then((res) => setUnread(res.data))
      .catch(() => {});
  }, [isAuthenticated]);

  // Refresh on sign-in, on navigation, when the window regains focus, periodically,
  // and whenever a page reports that notifications changed.
  useEffect(() => {
    fetchUnread();
  }, [fetchUnread, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onFocus);
    const timer = window.setInterval(fetchUnread, NOTIFICATION_POLL_MS);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onFocus);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, fetchUnread]);

  const notifications = isAuthenticated ? unread : [];
  const unreadCount = notifications.length;
  const navItems = navByRole[isAuthenticated && role ? role : 'Guest'];
  const displayName = user ? `${user.firstName} ${user.lastName}` : userName || 'Account';
  const profileRoute = role ? profileRouteByRole[role] : undefined;

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnread([]);
      notifyNotificationsChanged();
    } catch { /* the bell refreshes on the next poll */ }
  };

  const openNotification = async (n: Notification) => {
    try {
      await notificationsApi.markAsRead(n.id);
      setUnread((prev) => prev.filter((x) => x.id !== n.id));
    } catch { /* still navigate */ }
    const target = n.relatedEntityId && role ? appointmentsRouteByRole[role] : undefined;
    navigate(target ?? '/notifications');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden h-full items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full items-center px-3 text-sm font-medium transition-colors',
                  'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors',
                  isActive ? 'text-foreground after:bg-primary' : 'text-muted-foreground hover:text-foreground after:bg-transparent'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  >
                    <Bell className="size-5" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={handleMarkAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center px-4 py-8 text-center">
                        <Bell className="mb-2 size-6 text-muted-foreground/50" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No new notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          onSelect={() => openNotification(n)}
                          className="flex cursor-pointer flex-col items-start gap-0.5 rounded-md px-3 py-2.5"
                        >
                          <span className="flex w-full items-start gap-2">
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            <span className="flex-1 text-sm font-medium leading-snug text-foreground">{n.title}</span>
                          </span>
                          <span className="line-clamp-2 pl-4 text-xs text-muted-foreground">{n.message}</span>
                          <span className="pl-4 text-[11px] text-muted-foreground/80">{formatTimeAgo(n.createdAt)}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <div className="border-t p-1">
                    <DropdownMenuItem asChild className="cursor-pointer justify-center rounded-md py-2 text-sm font-medium text-primary">
                      <Link to="/notifications">View all notifications</Link>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Account menu (desktop) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden h-10 gap-2 pl-1.5 pr-2 md:inline-flex" aria-label={`Account menu for ${displayName}`}>
                    <UserAvatar name={displayName} size="sm" />
                    <span className="max-w-[9rem] truncate text-sm font-medium">{user?.firstName ?? displayName}</span>
                    <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                    <p className="mt-1.5 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{role}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileRoute && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={profileRoute}><User aria-hidden="true" /> Profile</Link>
                    </DropdownMenuItem>
                  )}
                  {role === 'Patient' && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/patient/appointments"><CalendarDays aria-hidden="true" /> My appointments</Link>
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
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register/patient">Create account</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 pr-8">
                    <UserAvatar name={displayName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                ) : (
                  <Logo asLink={false} />
                )}
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-0.5 p-3">
                {[{ label: 'Home', to: '/' }, ...navItems].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
                        isActive ? 'bg-secondary text-secondary-foreground' : 'text-foreground hover:bg-accent'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {isAuthenticated && (
                  <>
                    <div className="my-2 border-t" />
                    <NavLink
                      to="/notifications"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
                          isActive ? 'bg-secondary text-secondary-foreground' : 'text-foreground hover:bg-accent'
                        )
                      }
                    >
                      Notifications
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                          {unreadCount} new
                        </span>
                      )}
                    </NavLink>
                    {profileRoute && (
                      <NavLink
                        to={profileRoute}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
                            isActive ? 'bg-secondary text-secondary-foreground' : 'text-foreground hover:bg-accent'
                          )
                        }
                      >
                        Profile
                      </NavLink>
                    )}
                  </>
                )}
              </nav>
              <div className="mt-auto border-t p-4">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                  >
                    <LogOut aria-hidden="true" /> Sign out
                  </Button>
                ) : (
                  <div className="grid gap-2">
                    <Button asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/register/patient">Create account</Link>
                    </Button>
                    <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
