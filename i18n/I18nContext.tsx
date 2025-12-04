import React, { createContext, useContext, ReactNode } from 'react';
import { Language, Translation } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';

interface I18nContextType {
  language: Language;
  t: Translation;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Language, Translation> = {
  en,
  zh,
};

interface I18nProviderProps {
  children: ReactNode;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  language,
  onLanguageChange
}) => {
  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, t, setLanguage: onLanguageChange }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
