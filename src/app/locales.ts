import arAppointments from '@/features/appointments/i18n/ar.json';
import enAppointments from '@/features/appointments/i18n/en.json';
import arAuth from '@/features/auth/i18n/ar.json';
import enAuth from '@/features/auth/i18n/en.json';
import arBilling from '@/features/billing/i18n/ar.json';
import enBilling from '@/features/billing/i18n/en.json';
import arDesk from '@/features/desk/i18n/ar.json';
import enDesk from '@/features/desk/i18n/en.json';
import arDoctor from '@/features/doctor/i18n/ar.json';
import enDoctor from '@/features/doctor/i18n/en.json';
import arDoctors from '@/features/doctors/i18n/ar.json';
import enDoctors from '@/features/doctors/i18n/en.json';
import arEncounters from '@/features/encounters/i18n/ar.json';
import enEncounters from '@/features/encounters/i18n/en.json';
import arEntitlements from '@/features/entitlements/i18n/ar.json';
import enEntitlements from '@/features/entitlements/i18n/en.json';
import arHistory from '@/features/history/i18n/ar.json';
import enHistory from '@/features/history/i18n/en.json';
import arNotifications from '@/features/notifications/i18n/ar.json';
import enNotifications from '@/features/notifications/i18n/en.json';
import arPatients from '@/features/patients/i18n/ar.json';
import enPatients from '@/features/patients/i18n/en.json';
import arProfile from '@/features/profile/i18n/ar.json';
import enProfile from '@/features/profile/i18n/en.json';
import arQueue from '@/features/queue/i18n/ar.json';
import enQueue from '@/features/queue/i18n/en.json';
import arRecords from '@/features/records/i18n/ar.json';
import enRecords from '@/features/records/i18n/en.json';
import arRecruitment from '@/features/recruitment/i18n/ar.json';
import enRecruitment from '@/features/recruitment/i18n/en.json';
import arSite from '@/features/site/i18n/ar.json';
import enSite from '@/features/site/i18n/en.json';
import arTriage from '@/features/triage/i18n/ar.json';
import enTriage from '@/features/triage/i18n/en.json';
import arCommon from '@/shared/i18n/locales/ar/common.json';
import arNav from '@/shared/i18n/locales/ar/nav.json';
import arScreens from '@/shared/i18n/locales/ar/screens.json';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enNav from '@/shared/i18n/locales/en/nav.json';
import enScreens from '@/shared/i18n/locales/en/screens.json';

// Every translation namespace, per language. A feature adds its own `i18n/{en,ar}.json` here; the
// English files define the keys (see i18next.d.ts) and a test checks Arabic has the same ones.
export const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    screens: enScreens,
    auth: enAuth,
    doctors: enDoctors,
    recruitment: enRecruitment,
    site: enSite,
    appointments: enAppointments,
    records: enRecords,
    profile: enProfile,
    notifications: enNotifications,
    patients: enPatients,
    desk: enDesk,
    queue: enQueue,
    triage: enTriage,
    billing: enBilling,
    doctor: enDoctor,
    encounters: enEncounters,
    history: enHistory,
    entitlements: enEntitlements,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    screens: arScreens,
    auth: arAuth,
    doctors: arDoctors,
    recruitment: arRecruitment,
    site: arSite,
    appointments: arAppointments,
    records: arRecords,
    profile: arProfile,
    notifications: arNotifications,
    patients: arPatients,
    desk: arDesk,
    queue: arQueue,
    triage: arTriage,
    billing: arBilling,
    doctor: arDoctor,
    encounters: arEncounters,
    history: arHistory,
    entitlements: arEntitlements,
  },
} as const;

export type Namespace = keyof (typeof resources)['en'];
