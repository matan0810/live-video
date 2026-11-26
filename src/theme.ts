import { storedChoice } from './hooks/storedValues';

/** The site's look: the device's own choice ("auto"), or always light or dark. */
export const THEMES = ['auto', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_KEY = 'live-video:theme';
const BAR_COLOURS = { light: '#f4f5f7', dark: '#0b0d10' } as const;
const LIGHT_QUERY = '(prefers-color-scheme: light)';

export const parseTheme = (value: unknown): Theme | null => storedChoice(value, THEMES);

/** The stored choice, read before the first paint so a light page never flashes dark. */
export function storedTheme(): Theme {
  try {
    return parseTheme(JSON.parse(localStorage.getItem(THEME_KEY) ?? 'null')) ?? 'auto';
  } catch {
    return 'auto';
  }
}

export function effectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

/** Sets the page's theme (CSS reads `data-theme`) and the browser bar's colour to match. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BAR_COLOURS[effectiveTheme(theme)]);
}

export function watchDeviceTheme(onChange: () => void) {
  const query = window.matchMedia(LIGHT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
