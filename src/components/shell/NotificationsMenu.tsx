import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatTimeAgo } from '@/lib/format';
import { appointmentsRouteByRole } from '@/lib/navigation';
import type { Notification, UserRole } from '@/types';

interface NotificationsMenuProps {
  role: UserRole | null;
  unread: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => Promise<void>;
}

/** Bell button with the five latest unread notifications. */
export function NotificationsMenu({ role, unread, onMarkAllRead, onMarkRead }: NotificationsMenuProps) {
  const navigate = useNavigate();
  const unreadCount = unread.length;

  const openNotification = async (n: Notification) => {
    await onMarkRead(n.id);
    const target = n.relatedEntityId && role ? appointmentsRouteByRole[role] : undefined;
    navigate(target ?? '/notifications');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div>
            <p className="font-display text-title-sm">Notifications</p>
            <p className="text-body-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1 scrollbar-thin">
          {unreadCount === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Bell className="size-5" aria-hidden="true" />
              </span>
              <p className="text-body-md text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            unread.slice(0, 5).map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => openNotification(n)}
                className="flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5"
              >
                <span className="flex w-full items-start gap-2">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="flex-1 text-sm font-semibold leading-snug text-foreground">{n.title}</span>
                </span>
                <span className="line-clamp-2 pl-4 text-body-sm text-muted-foreground">{n.message}</span>
                <span className="pl-4 text-caption text-muted-foreground/80">{formatTimeAgo(n.createdAt)}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="border-t border-border/70 p-1">
          <DropdownMenuItem asChild className="cursor-pointer justify-center py-2 text-label-md text-primary focus:text-primary">
            <Link to="/notifications">View all notifications</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
