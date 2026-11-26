import { useSyncExternalStore } from 'react';

/**
 * Installing the site as an app. Chrome offers it once, early, through the
 * `beforeinstallprompt` event; it is kept here so the About window can offer it later. The
 * listener is registered on import (main.tsx imports this module first thing).
 */
let offer: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  offer = event;
  notify();
});
window.addEventListener('appinstalled', () => {
  offer = null;
  notify();
});

/** Already running as an installed app: nothing to offer. */
export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && navigator.standalone === true);

/** The browser's install offer, or null when it has none (or the site is installed). */
export function useInstallOffer() {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => offer,
  );
  if (!current) return null;
  return () => {
    void current.prompt().catch(() => undefined);
  };
}
