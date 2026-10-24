import 'i18next';
import type { resources } from './locales';

// Typed translation keys: `t('actions.save')` is checked against the English files at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
  }
}
