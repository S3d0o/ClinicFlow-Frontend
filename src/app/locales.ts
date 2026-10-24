import arAppointments from '@/features/appointments/i18n/ar.json';
import enAppointments from '@/features/appointments/i18n/en.json';
import arAuth from '@/features/auth/i18n/ar.json';
import enAuth from '@/features/auth/i18n/en.json';
import arDoctors from '@/features/doctors/i18n/ar.json';
import enDoctors from '@/features/doctors/i18n/en.json';
import arNotifications from '@/features/notifications/i18n/ar.json';
import enNotifications from '@/features/notifications/i18n/en.json';
import arProfile from '@/features/profile/i18n/ar.json';
import enProfile from '@/features/profile/i18n/en.json';
import arRecords from '@/features/records/i18n/ar.json';
import enRecords from '@/features/records/i18n/en.json';
import arRecruitment from '@/features/recruitment/i18n/ar.json';
import enRecruitment from '@/features/recruitment/i18n/en.json';
import arSite from '@/features/site/i18n/ar.json';
import enSite from '@/features/site/i18n/en.json';
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
  },
} as const;

export type Namespace = keyof (typeof resources)['en'];
