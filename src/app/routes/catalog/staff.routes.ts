import { lazy } from 'react';
import type { Permission } from '@/features/auth/model/permissions';
import type { ScreenRoute } from '../types';

const allow = (...anyOf: Permission[]) => ({ kind: 'permission', anyOf }) as const;
// Branch-wide screens: a grant over one's own records only (a doctor's own reports) doesn't open them
const allowBranchWide = (...anyOf: Permission[]) => ({ kind: 'permission', anyOf, minScope: 'Branch' }) as const;

// Front desk and nurse station (phase 3). Check-in (front-desk/04) is a panel on the Today screen.
export const deskRoutes: ScreenRoute[] = [
  {
    path: '/desk', screen: 'deskToday', layout: 'staff', access: allow('appointments.book_on_behalf'), phase: 3, design: 'front-desk/01-today',
    component: lazy(() => import('@/features/desk/pages/DeskTodayPage')),
  },
  {
    path: '/desk/patients', screen: 'deskPatients', layout: 'staff', access: allow('patients.register'), phase: 3, design: 'front-desk/02-patient-search-and-register',
    component: lazy(() => import('@/features/patients/pages/PatientsPage')),
  },
  {
    path: '/desk/book', screen: 'deskBook', layout: 'staff', access: allow('appointments.book_on_behalf'), phase: 3, design: 'front-desk/03-book-walk-in',
    component: lazy(() => import('@/features/desk/pages/DeskBookPage')),
  },
  {
    path: '/desk/queue', screen: 'deskQueue', layout: 'staff', access: allow('queue.view'), phase: 3, design: 'front-desk/05-queue-board',
    component: lazy(() => import('@/features/queue/pages/QueueBoardPage')),
  },
  {
    path: '/desk/payments', screen: 'deskCheckout', layout: 'staff', access: allow('payments.collect'), phase: 3, design: 'front-desk/07-checkout',
    component: lazy(() => import('@/features/billing/pages/CheckoutPage')),
  },
  {
    path: '/desk/cash', screen: 'deskCash', layout: 'staff', access: allow('cash_sessions.operate'), phase: 3, design: 'front-desk/08-cash-session',
    component: lazy(() => import('@/features/billing/pages/CashSessionPage')),
  },
  // Read-only TV screen per branch (FR-FD-06); a device token replaces the staff login later
  {
    path: '/display/:branchId', screen: 'waitingDisplay', layout: 'bare', access: allow('queue.view'), phase: 3, design: 'front-desk/06-waiting-room-tv-display',
    component: lazy(() => import('@/features/queue/pages/WaitingDisplayPage')),
  },
  {
    path: '/nurse', screen: 'nurseQueue', layout: 'tablet', access: allow('vitals.write'), phase: 3, design: 'nurse/01-triage-queue',
    component: lazy(() => import('@/features/triage/pages/NurseQueuePage')),
  },
  {
    path: '/nurse/triage/:appointmentId', screen: 'nurseTriage', layout: 'tablet', access: allow('vitals.write'), phase: 3, design: 'nurse/02-vitals-and-triage-form',
    component: lazy(() => import('@/features/triage/pages/TriagePage')),
  },
];

// Doctor workspace (phase 4).
export const doctorRoutes: ScreenRoute[] = [
  {
    path: '/doctor', screen: 'doctorToday', layout: 'staff', access: allow('encounters.write'), phase: 4, design: 'doctor/01-today',
    component: lazy(() => import('@/features/doctor/pages/DoctorTodayPage')),
  },
  {
    path: '/doctor/encounters/:appointmentId', screen: 'encounter', layout: 'staff', access: allow('encounters.write'), phase: 4, design: 'doctor/02-encounter-workspace',
    component: lazy(() => import('@/features/encounters/pages/EncounterPage')),
  },
  {
    path: '/doctor/patients', screen: 'patientHistory', layout: 'staff', access: allow('encounters.view'), phase: 4, design: 'doctor/03-patient-history-timeline',
    component: lazy(() => import('@/features/history/pages/PatientsListPage')),
  },
  {
    path: '/doctor/patients/:patientId', screen: 'patientHistory', layout: 'staff', access: allow('encounters.view'), phase: 4, design: 'doctor/03-patient-history-timeline',
    component: lazy(() => import('@/features/history/pages/PatientHistoryPage')),
  },
  {
    path: '/doctor/schedule', screen: 'doctorSchedule', layout: 'staff', access: allow('leave.request'), phase: 4, design: 'doctor/04-my-schedule-and-leave',
    component: lazy(() => import('@/features/doctor/pages/DoctorSchedulePage')),
  },
];

// Manager workspace (phase 5).
export const managerRoutes: ScreenRoute[] = [
  { path: '/manager', screen: 'managerDashboard', layout: 'staff', access: allowBranchWide('reports.operational'), phase: 5, design: 'manager/01-dashboard' },
  { path: '/manager/approvals', screen: 'approvals', layout: 'staff', access: allow('refunds.approve', 'leave.approve', 'invoices.void', 'cash_sessions.reconcile'), phase: 5, design: 'manager/07-approvals-inbox' },
  { path: '/manager/schedules', screen: 'schedules', layout: 'staff', access: allow('schedules.manage'), phase: 5, design: 'manager/05-doctor-schedules' },
  { path: '/manager/leave', screen: 'leave', layout: 'staff', access: allow('leave.approve'), phase: 5, design: 'manager/06-leave-requests-and-reschedule-worklist' },
  { path: '/manager/recruitment', screen: 'recruitment', layout: 'staff', access: allow('recruitment.view'), phase: 5, design: 'manager/03-recruitment-applications' },
  { path: '/manager/recruitment/:applicationId', screen: 'applicationDetail', layout: 'staff', access: allow('recruitment.view'), phase: 5, design: 'manager/04-application-detail' },
  { path: '/manager/catalog', screen: 'catalog', layout: 'staff', access: allow('services.manage', 'prices.manage'), phase: 5, design: 'manager/02-services-and-price-list' },
  { path: '/manager/daily-close', screen: 'dailyClose', layout: 'staff', access: allow('cash_sessions.reconcile'), phase: 5, design: 'manager/08-daily-close' },
  { path: '/manager/reports', screen: 'reports', layout: 'staff', access: { ...allowBranchWide('reports.financial', 'reports.operational'), module: 'RPT' }, phase: 5, design: 'manager/09-reports-and-exports' },
];

// System administration (phase 6).
export const adminRoutes: ScreenRoute[] = [
  { path: '/admin', screen: 'adminOverview', layout: 'staff', access: allow('integrations.manage'), phase: 6, design: 'admin/01-overview' },
  { path: '/admin/staff', screen: 'staff', layout: 'staff', access: allow('staff.invite'), phase: 6, design: 'admin/02-staff' },
  { path: '/admin/staff/:staffId', screen: 'staffDetail', layout: 'staff', access: allow('staff.invite'), phase: 6, design: 'admin/03-staff-member-detail' },
  { path: '/admin/roles', screen: 'roles', layout: 'staff', access: allow('roles.manage'), phase: 6, design: 'admin/04-roles-and-permissions' },
  { path: '/admin/branches', screen: 'branches', layout: 'staff', access: allow('branches.manage'), phase: 6, design: 'admin/05-branches' },
  { path: '/admin/specialties', screen: 'specialties', layout: 'staff', access: allow('specialties.manage'), phase: 6, design: 'admin/09-specialties' },
  { path: '/admin/settings', screen: 'settings', layout: 'staff', access: allow('org.settings.manage'), phase: 6, design: 'admin/06-settings' },
  { path: '/admin/integrations', screen: 'integrations', layout: 'staff', access: allow('integrations.manage', 'notifications.templates'), phase: 6, design: 'admin/07-integrations-and-message-templates' },
  { path: '/admin/audit', screen: 'audit', layout: 'staff', access: allow('audit.view'), phase: 6, design: 'admin/08-audit-log' },
  {
    // No Stitch design: the plan, its limits and the modules on (ADR 0008; release R1)
    path: '/admin/subscription', screen: 'subscription', layout: 'staff', access: allow('org.settings.manage'), phase: 6,
    component: lazy(() => import('@/features/entitlements/pages/SubscriptionPage')),
  },
];

// Finance (phase 7). Works without an accountant: managers hold the same permissions (02 §6).
export const financeRoutes: ScreenRoute[] = [
  { path: '/finance', screen: 'financeOverview', layout: 'staff', access: allow('cash_sessions.reconcile'), phase: 7, design: 'accountant/01-financial-overview' },
  { path: '/finance/invoices', screen: 'financeInvoices', layout: 'staff', access: allow('invoices.void'), phase: 7, design: 'accountant/02-invoices-and-billing-ledger' },
  { path: '/finance/payers', screen: 'payers', layout: 'staff', access: allow('payers.manage'), phase: 7, design: 'accountant/03-payers-and-plans' },
  { path: '/finance/claims', screen: 'claims', layout: 'staff', access: allow('claims.manage'), phase: 7, design: 'accountant/04-claims-workspace' },
];

// Shared by every staff role.
export const sharedStaffRoutes: ScreenRoute[] = [
  { path: '/notifications', screen: 'notifications', layout: 'staff', access: { kind: 'signed-in' }, phase: 2, design: 'patient/18-notifications' },
];
