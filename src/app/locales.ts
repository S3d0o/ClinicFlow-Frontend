import arCommon from '@/shared/i18n/locales/ar/common.json';
import arNav from '@/shared/i18n/locales/ar/nav.json';
import arScreens from '@/shared/i18n/locales/ar/screens.json';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enNav from '@/shared/i18n/locales/en/nav.json';
import enScreens from '@/shared/i18n/locales/en/screens.json';

// Every translation namespace, per language. A feature adds its own `i18n/{en,ar}.json` here; the
// English files define the keys (see i18next.d.ts) and a test checks Arabic has the same ones.
export const resources = {
  en: { common: enCommon, nav: enNav, screens: enScreens },
  ar: { common: arCommon, nav: arNav, screens: arScreens },
} as const;

export type Namespace = keyof (typeof resources)['en'];
