import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../i18n/translations';

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  t: (key: TranslationKey) => string;
  toggleLanguage: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

const STORAGE_LANG_KEY = '@el_cantin_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar'); // Default to Arabic as requested

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'ar') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Failed to load language', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_LANG_KEY, lang);
  };

  const toggleLanguage = async () => {
    const nextLang: Language = language === 'ar' ? 'en' : 'ar';
    await setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language];
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL: language === 'ar',
        t,
        toggleLanguage,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
