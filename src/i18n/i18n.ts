import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ca from './locales/ca';
import en from './locales/en';
import es from './locales/es';

const LANGUAGE_KEY = 'user_language';

export type SupportedLanguage = 'en' | 'ca' | 'es';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ca', 'es'];

// Resolve device locale to one of our supported languages
function getDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales?.()?.[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(locale as SupportedLanguage)
    ? (locale as SupportedLanguage)
    : 'en';
}

// Load persisted language or fall back to device language
async function getInitialLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch {}
  return getDeviceLanguage();
}

// Persist language choice
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function initI18n(): Promise<void> {
  const language = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ca: { translation: ca },
        es: { translation: es }
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React handles XSS
      },
    });
}

export default i18n;