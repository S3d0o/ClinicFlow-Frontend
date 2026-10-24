import { DEFAULT_LANGUAGE, isLanguage, type Language } from './languages';

const STORAGE_KEY = 'clinicflow:language';

/** The language the user last picked, or Arabic (the default) when none is stored. */
export function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only
  }
}
