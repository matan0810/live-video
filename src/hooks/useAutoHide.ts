import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Visibility for controls that appear on activity and fade after a pause, like a TV's
 * on-screen channel bar. `reveal` shows them and restarts the countdown; `hold` keeps them
 * up while the pointer is over them.
 */
export function useAutoHide(delayMs: number) {
  const [isVisible, setIsVisible] = useState(false);
  const isHeld = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const schedule = useCallback(() => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      if (!isHeld.current) setIsVisible(false);
    }, delayMs);
  }, [delayMs]);

  const reveal = useCallback(() => {
    setIsVisible(true);
    schedule();
  }, [schedule]);

  const hold = useCallback(
    (isHolding: boolean) => {
      isHeld.current = isHolding;
      if (!isHolding) schedule();
    },
    [schedule],
  );

  useEffect(() => () => clearTimeout(timeout.current), []);

  return { isVisible, reveal, hold };
}
