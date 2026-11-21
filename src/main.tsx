import '@fontsource-variable/heebo';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n/LanguageProvider';
import { Root } from './Root';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// The address is read once: moving between the site and the admin area reloads the page.
window.addEventListener('hashchange', () => window.location.reload());

// A saved copy of the site (public/sw.js): opens at once and on a weak connection. Only in
// the built site, so development always shows the current code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => undefined);
  });
}

createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </StrictMode>,
);
