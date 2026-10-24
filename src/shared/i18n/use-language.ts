import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, directionOf, isLanguage, type Language } from './languages';

/** The current UI language and direction, and a way to change them. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  const setLanguage = useCallback((next: Language) => void i18n.changeLanguage(next), [i18n]);
  const toggleLanguage = useCallback(
    () => void i18n.changeLanguage(language === 'ar' ? 'en' : 'ar'),
    [i18n, language]
  );

  return { language, direction: directionOf(language), setLanguage, toggleLanguage };
}
