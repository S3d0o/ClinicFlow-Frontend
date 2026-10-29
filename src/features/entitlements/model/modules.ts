import type { Permission } from '@/features/auth/model/permissions';
import type { CurrentUser } from '@/features/auth/model/user';

// The module catalog (backend ADR 0008 decisions 3–5; modules overview). One platform serves every
// clinic, and each clinic's plan switches add-ons on. The backend decides; the UI only hides what a
// clinic's plan doesn't include (decision 12).

/** Every clinic has these. */
export const CORE_MODULES = ['ORG', 'STF', 'ACC', 'SVC', 'SCH', 'APT', 'NTF', 'AUD'] as const;

/** Switched on by the clinic's plan or as an extra. */
export const ADD_ON_MODULES = ['FD', 'BIL', 'EMR', 'INS', 'RPT', 'PAT', 'REC', 'BOT'] as const;

export type CoreModule = (typeof CORE_MODULES)[number];
export type AddOnModule = (typeof ADD_ON_MODULES)[number];
export type ModuleCode = CoreModule | AddOnModule;

export const isCoreModule = (module: ModuleCode): module is CoreModule => (CORE_MODULES as readonly string[]).includes(module);

/** What an add-on needs on as well; switching it on switches these on (ADR 0008 decision 4). */
export const MODULE_REQUIRES: Partial<Record<AddOnModule, AddOnModule[]>> = {
  INS: ['BIL', 'EMR'],
  BOT: ['PAT'],
};

/** The add-ons that need `module` and are on, which is why it can't be switched off. */
export function requiredBy(module: AddOnModule, enabled: ReadonlySet<ModuleCode>): AddOnModule[] {
  return ADD_ON_MODULES.filter((other) => enabled.has(other) && (MODULE_REQUIRES[other] ?? []).includes(module));
}

/**
 * The module each permission belongs to (02 §5 module column, made authoritative by ADR 0008
 * decision 3). A grant counts only while its module is on. The core appointment module covers
 * booking on behalf and check-in, so a clinic without the front desk add-on still runs a calendar;
 * the add-on brings the live queue, the waiting-room screen and triage.
 */
export const PERMISSION_MODULE: Record<Permission, ModuleCode> = {
  'org.settings.manage': 'ORG',
  'branches.manage': 'ORG',
  'rooms.manage': 'ORG',
  'staff.view': 'STF',
  'staff.invite': 'STF',
  'staff.deactivate': 'STF',
  'roles.manage': 'STF',
  'recruitment.view': 'REC',
  'recruitment.manage': 'REC',
  'specialties.manage': 'SVC',
  'services.manage': 'SVC',
  'prices.manage': 'SVC',
  'schedules.view': 'SCH',
  'schedules.manage': 'SCH',
  'schedules.manage_own': 'SCH',
  'leave.request': 'SCH',
  'leave.approve': 'SCH',
  'slots.block': 'SCH',
  'slots.overbook': 'SCH',
  'patients.view': 'APT',
  'patients.register': 'APT',
  'patients.edit': 'APT',
  'patients.merge': 'APT',
  'appointments.view': 'APT',
  'appointments.book_on_behalf': 'APT',
  'appointments.reschedule': 'APT',
  'appointments.cancel': 'APT',
  'appointments.check_in': 'APT',
  'appointments.mark_no_show': 'APT',
  'queue.view': 'FD',
  'queue.manage': 'FD',
  'vitals.write': 'FD',
  'encounters.view': 'EMR',
  'encounters.write': 'EMR',
  'encounters.sign': 'EMR',
  'encounters.addend': 'EMR',
  'encounters.void': 'EMR',
  'prescriptions.write': 'EMR',
  'attachments.upload': 'EMR',
  'records.break_glass': 'EMR',
  'invoices.view': 'BIL',
  'invoices.create': 'BIL',
  'invoices.discount': 'BIL',
  'invoices.void': 'BIL',
  'payments.collect': 'BIL',
  'refunds.request': 'BIL',
  'refunds.approve': 'BIL',
  'cash_sessions.operate': 'BIL',
  'cash_sessions.reconcile': 'BIL',
  'payers.manage': 'INS',
  'policies.manage': 'INS',
  'preauth.manage': 'INS',
  'claims.manage': 'INS',
  // The dashboard is core; the reports and exports beyond it are the RPT add-on (routes say so)
  'reports.operational': 'APT',
  'reports.clinical': 'RPT',
  'reports.financial': 'BIL',
  'audit.view': 'AUD',
  'integrations.manage': 'NTF',
  'notifications.templates': 'NTF',
};

/**
 * The modules a clinic has: the core, its plan's add-ons, then its overrides (extras bought, or an
 * add-on switched off), closed over what each enabled add-on needs.
 */
export function effectiveModules(
  planModules: readonly AddOnModule[],
  overrides: readonly { module: AddOnModule; enabled: boolean }[] = []
): Set<ModuleCode> {
  const enabled = new Set<ModuleCode>([...CORE_MODULES, ...planModules]);
  for (const { module, enabled: on } of overrides) {
    if (on) enabled.add(module);
    else enabled.delete(module);
  }
  let added = true;
  while (added) {
    added = false;
    for (const module of ADD_ON_MODULES) {
      if (!enabled.has(module)) continue;
      for (const needed of MODULE_REQUIRES[module] ?? []) {
        if (!enabled.has(needed)) {
          enabled.add(needed);
          added = true;
        }
      }
    }
  }
  return enabled;
}

/** The user as the clinic's plan sees them: grants whose module is off are dropped. */
export function withModules(user: CurrentUser, modules: ReadonlySet<ModuleCode>): CurrentUser {
  const permissions = user.permissions.filter((grant) => modules.has(PERMISSION_MODULE[grant.permission]));
  return permissions.length === user.permissions.length ? user : { ...user, permissions };
}
