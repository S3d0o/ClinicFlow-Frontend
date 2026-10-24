import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { directionOf, isLanguage, type Language } from '@/shared/i18n/languages';
import { readStoredLanguage, storeLanguage } from '@/shared/i18n/language-storage';
import { resources } from './locales';

/** Mirrors the language on <html>: `lang` for screen readers and fonts, `dir` for the layout. */
function applyToDocument(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = directionOf(language);
}

/** Starts i18next once. Later language changes update <html> and are remembered. */
export function initI18n(language: Language = readStoredLanguage()) {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: Object.keys(resources.en),
      interpolation: { escapeValue: false }, // React already escapes
      initAsync: false, // resources are bundled, so initialise synchronously
    });
    i18n.on('languageChanged', (lng) => {
      if (!isLanguage(lng)) return;
      applyToDocument(lng);
      storeLanguage(lng);
    });
  } else if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
  applyToDocument(language);
  return i18n;
}
