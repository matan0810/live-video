import { useEffect } from 'react';
import { applyTheme, parseTheme, THEME_KEY, watchDeviceTheme, type Theme } from '../theme';
import { useLocalStorage } from './useLocalStorage';

/** The chosen theme, applied to the page and kept across visits. */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'auto', parseTheme);

  useEffect(() => {
    applyTheme(theme);
    // On "auto" the browser bar follows the device when it switches between light and dark.
    if (theme !== 'auto') return;
    return watchDeviceTheme(() => applyTheme('auto'));
  }, [theme]);

  return [theme, setTheme] as const;
}
