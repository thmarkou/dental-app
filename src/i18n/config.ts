/**
 * Internationalization (i18n) Configuration
 * Supports Greek (el) and English (en)
 */

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import enTranslations from './locales/en.json';
import elTranslations from './locales/el.json';

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
const supportedLanguages = ['en', 'el'];

// Determine initial language
const initialLanguage = supportedLanguages.includes(deviceLanguage) 
  ? deviceLanguage 
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: enTranslations,
      },
      el: {
        translation: elTranslations,
      },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;

