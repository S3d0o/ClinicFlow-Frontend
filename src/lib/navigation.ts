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
