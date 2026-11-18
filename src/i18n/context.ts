import { createContext, useContext } from 'react';
import { STRINGS, type Language, type Strings } from './strings';

export interface I18n {
  language: Language;
  t: Strings;
  setLanguage: (language: Language) => void;
}

export const I18nContext = createContext<I18n>({
  language: 'he',
  t: STRINGS.he,
  setLanguage: () => undefined,
});

export function useI18n() {
  return useContext(I18nContext);
}
