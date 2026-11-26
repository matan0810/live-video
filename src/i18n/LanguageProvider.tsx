import { useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { I18nContext } from './context';
import { defaultLanguage, isLanguage, STRINGS, type Language } from './strings';

const STORAGE_KEY = 'live-video:language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [stored, setLanguage] = useLocalStorage<Language | null>(STORAGE_KEY, null, (value) =>
    isLanguage(value) ? value : null,
  );
  const language = stored ?? defaultLanguage(navigator.languages);
  const t = STRINGS[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = t.dir;
    document.title = t.brand;
  }, [language, t]);

  const value = useMemo(() => ({ language, t, setLanguage }), [language, t, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
