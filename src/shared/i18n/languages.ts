/** UI languages (FR-ACC-06). Arabic is the default. */
export const LANGUAGES = ['ar', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Direction = 'rtl' | 'ltr';

export const DEFAULT_LANGUAGE: Language = 'ar';

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

export const directionOf = (language: Language): Direction => (language === 'ar' ? 'rtl' : 'ltr');

/**
 * BCP 47 locale for `Intl` formatting. Egyptian Arabic with Latin digits: prices, phone numbers,
 * times and ticket numbers stay readable and line up in tables in both languages.
 */
export const localeOf = (language: Language): string => (language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG');

/** The language's own name, shown in the language toggle. */
export const nativeNameOf = (language: Language): string => (language === 'ar' ? 'عربي' : 'EN');
