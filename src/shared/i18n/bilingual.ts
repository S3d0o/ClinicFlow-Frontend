import type { Language } from './languages';

/** Reference data shown to patients carries both names (backend R9). */
export interface Bilingual {
  nameEn: string;
  nameAr: string;
}

/** The item's name in the UI language. */
export const nameIn = (item: Bilingual, language: Language) => (language === 'ar' ? item.nameAr : item.nameEn);

/** A free text written in either or both languages (e.g. a doctor's bio): the UI language first. */
export const textIn = (en: string | undefined, ar: string | undefined, language: Language) =>
  (language === 'ar' ? ar || en : en || ar) ?? '';
