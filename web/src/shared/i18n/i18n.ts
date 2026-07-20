import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANG_STORAGE_KEY } from '../config/index.ts';
import { en } from './locales/en.ts';
import { ru } from './locales/ru.ts';

export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

function readStoredLanguage(): AppLanguage {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored === 'en' || stored === 'ru' ? stored : DEFAULT_LANGUAGE;
}

/** Idempotent i18next bootstrap. Safe to call from app init and from tests. */
export function initI18n(language: AppLanguage = readStoredLanguage()): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        ru: { translation: ru },
      },
      lng: language,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
  return i18n;
}

export { i18n };
