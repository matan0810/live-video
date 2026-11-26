import { useEffect } from 'react';
import { storedBoolean } from './storedValues';
import { useLocalStorage } from './useLocalStorage';

/**
 * The big-screen layout (for a TV), remembered on this device. It is also marked on the
 * root element, where it makes the whole interface a step larger.
 */
export function useBigScreen() {
  const [isBigScreen, setBigScreen] = useLocalStorage<boolean>(
    'live-video:big-screen',
    false,
    storedBoolean,
  );
  useEffect(() => {
    document.documentElement.toggleAttribute('data-big-screen', isBigScreen);
  }, [isBigScreen]);
  return [isBigScreen, setBigScreen] as const;
}
