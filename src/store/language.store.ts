/**
 * Language Store
 * Manages app language preference
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/config';

const LANGUAGE_KEY = '@dentalapp:language';

export type Language = 'en' | 'el';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  
  setLanguage: async (lang: Language) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    set({language: lang});
  },
  
  initializeLanguage: async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'el')) {
        await i18n.changeLanguage(savedLanguage);
        set({language: savedLanguage as Language});
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  },
}));

