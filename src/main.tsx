import '@fontsource-variable/heebo';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Root } from './Root';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// The address is read once: moving between the site and the admin area reloads the page.
window.addEventListener('hashchange', () => window.location.reload());

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
