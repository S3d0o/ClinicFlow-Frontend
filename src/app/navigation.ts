import {
  Banknote, Bell, Building2, CalendarCheck, CalendarClock, CalendarDays, CalendarOff, CalendarPlus,
  CalendarRange, ChartColumn, ChartPie, CircleUser, ClipboardList, FileHeart, Files, FileText, Gauge,
  HeartPulse, House, KeyRound, LayoutDashboard, ListChecks, ListOrdered, Plug, Receipt, ScrollText,
  Settings, Shapes, ShieldCheck, Stethoscope, Tags, UserPlus, Users, UsersRound, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { CurrentUser } from '@/features/auth/model/user';
import type enNav from '@/shared/i18n/locales/en/nav.json';
import { decideAccess } from './routes/access';
import { routeAt } from './routes';

type ItemKey = keyof typeof enNav.items;
type GroupKey = keyof typeof enNav.groups;
type PatientKey = keyof typeof enNav.patient;
type PublicKey = keyof typeof enNav.public;

export interface NavItem<K extends string = ItemKey> {
  to: string;
  label: K;
  icon: LucideIcon;
}

export interface NavGroup {
  label: GroupKey;
  items: NavItem[];
}

// Staff navigation. Whether an item shows comes from its route's access rule (routes/catalog), so
// adding a screen means adding an entry here; the shell itself never changes.
export const staffNav: NavGroup[] = [
  {
    label: 'frontDesk',
    items: [
      { to: '/desk', label: 'deskToday', icon: CalendarDays },
      { to: '/desk/queue', label: 'deskQueue', icon: ListOrdered },
      { to: '/desk/patients', label: 'deskPatients', icon: Users },
      { to: '/desk/book', label: 'deskBook', icon: CalendarPlus },
      { to: '/desk/payments', label: 'deskPayments', icon: Wallet },
      { to: '/desk/cash', label: 'deskCash', icon: Banknote },
    ],
  },
  {
    label: 'nurse',
    items: [{ to: '/nurse', label: 'nurseTriage', icon: HeartPulse }],
  },
  {
    label: 'clinical',
    items: [
      { to: '/doctor', label: 'doctorToday', icon: Stethoscope },
      { to: '/doctor/patients', label: 'doctorPatients', icon: ClipboardList },
      { to: '/doctor/schedule', label: 'doctorSchedule', icon: CalendarClock },
    ],
  },
  {
    label: 'management',
    items: [
      { to: '/manager', label: 'managerDashboard', icon: LayoutDashboard },
      { to: '/manager/approvals', label: 'managerApprovals', icon: ListChecks },
      { to: '/manager/schedules', label: 'managerSchedules', icon: CalendarRange },
      { to: '/manager/leave', label: 'managerLeave', icon: CalendarOff },
      { to: '/manager/recruitment', label: 'managerRecruitment', icon: UserPlus },
      { to: '/manager/catalog', label: 'managerCatalog', icon: Tags },
      { to: '/manager/daily-close', label: 'managerDailyClose', icon: Receipt },
      { to: '/manager/reports', label: 'managerReports', icon: ChartColumn },
    ],
  },
  {
    label: 'finance',
    items: [
      { to: '/finance', label: 'financeOverview', icon: ChartPie },
      { to: '/finance/invoices', label: 'financeInvoices', icon: FileText },
      { to: '/finance/payers', label: 'financePayers', icon: ShieldCheck },
      { to: '/finance/claims', label: 'financeClaims', icon: Files },
    ],
  },
  {
    label: 'administration',
    items: [
      { to: '/admin', label: 'adminOverview', icon: Gauge },
      { to: '/admin/staff', label: 'adminStaff', icon: UsersRound },
      { to: '/admin/roles', label: 'adminRoles', icon: KeyRound },
      { to: '/admin/branches', label: 'adminBranches', icon: Building2 },
      { to: '/admin/specialties', label: 'adminSpecialties', icon: Shapes },
      { to: '/admin/settings', label: 'adminSettings', icon: Settings },
      { to: '/admin/integrations', label: 'adminIntegrations', icon: Plug },
      { to: '/admin/audit', label: 'adminAudit', icon: ScrollText },
    ],
  },
  {
    label: 'account',
    items: [{ to: '/notifications', label: 'notifications', icon: Bell }],
  },
];

export const patientNav: NavItem<PatientKey>[] = [
  { to: '/patient', label: 'home', icon: House },
  { to: '/patient/book', label: 'book', icon: CalendarPlus },
  { to: '/patient/appointments', label: 'appointments', icon: CalendarCheck },
  { to: '/patient/visits', label: 'records', icon: FileHeart },
  { to: '/patient/profile', label: 'profile', icon: CircleUser },
];

export const publicNav: { to: string; label: PublicKey }[] = [
  { to: '/doctors', label: 'findDoctor' },
  { to: '/#branches', label: 'branches' },
  { to: '/#specialties', label: 'specialties' },
  { to: '/join', label: 'joinAsDoctor' },
];

/** The staff groups and items the user may open, without empty groups. */
export function visibleStaffNav(user: CurrentUser | null): NavGroup[] {
  return staffNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => decideAccess(user, routeAt(item.to).access) === 'allow'),
    }))
    .filter((group) => group.items.length > 0);
}
