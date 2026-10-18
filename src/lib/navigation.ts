import {
  BadgeCheck, Bell, CalendarClock, CalendarDays, LayoutDashboard, Stethoscope, UserRound, UserSearch,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

// Primary navigation per role (signed-out visitors get the Guest list)
export const navByRole: Record<UserRole | 'Guest', NavItem[]> = {
  Guest: [{ label: 'Find doctors', to: '/doctors', icon: UserSearch }],
  Patient: [
    { label: 'Appointments', to: '/patient/appointments', icon: CalendarDays },
    { label: 'Find doctors', to: '/doctors', icon: UserSearch },
  ],
  Doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', to: '/doctor/appointments', icon: CalendarDays },
    { label: 'Schedule', to: '/doctor/schedules', icon: CalendarClock },
  ],
  Admin: [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Doctor approvals', to: '/admin/pending-doctors', icon: BadgeCheck },
    { label: 'Specialties', to: '/admin/specialties', icon: Stethoscope },
  ],
};

export const notificationsNavItem: NavItem = { label: 'Notifications', to: '/notifications', icon: Bell };

export const profileNavByRole: Partial<Record<UserRole, NavItem>> = {
  Patient: { label: 'Profile', to: '/patient/profile', icon: UserRound },
  Doctor: { label: 'Profile', to: '/doctor/profile', icon: UserRound },
};

/** Where a notification about an appointment takes each role */
export const appointmentsRouteByRole: Partial<Record<UserRole, string>> = {
  Patient: '/patient/appointments',
  Doctor: '/doctor/appointments',
};

/** Label shown in the top bar next to the role pill */
export const workspaceLabelByRole: Record<UserRole, string> = {
  Patient: 'Patient portal',
  Doctor: 'Clinic workspace',
  Admin: 'Clinic administration',
};

/** Where each role lands after signing in */
export const homeByRole: Record<UserRole, string> = {
  Patient: '/patient/appointments',
  Doctor: '/doctor/dashboard',
  Admin: '/admin/dashboard',
};

// Route prefixes that only one role can open
const rolePrefixes: [string, UserRole][] = [
  ['/patient/', 'Patient'],
  ['/doctor/', 'Doctor'],
  ['/admin/', 'Admin'],
];

/**
 * Where to send a user who just signed in: back to the page they asked for (`from`) if their role
 * can open it, otherwise to their role's home.
 */
export function postLoginPath(role: UserRole, from?: string): string {
  if (from) {
    const owner = rolePrefixes.find(([prefix]) => from.startsWith(prefix))?.[1];
    if (!owner || owner === role) return from;
  }
  return homeByRole[role];
}
