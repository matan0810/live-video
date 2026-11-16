import { useEffect } from 'react';

/**
 * Maps physical keys (`KeyboardEvent.code`, e.g. "KeyF") to actions. Codes are used
 * instead of characters so shortcuts work the same on a Hebrew keyboard layout.
 */
export type KeyboardShortcuts = Readonly<Record<string, () => void>>;

const TYPING_ELEMENTS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO']);

function isHandledByTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  // Form fields need the keys for typing, and a focused <video> has its own key controls.
  return TYPING_ELEMENTS.has(target.tagName) || target.isContentEditable;
}

/** Registers global keyboard shortcuts. Pass a memoized map to avoid re-subscribing. */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isHandledByTarget(event.target)) return;
      const action = shortcuts[event.code];
      if (!action) return;
      event.preventDefault();
      action();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
