import { useCallback, useEffect, useRef, useState } from 'react';

/** Long enough to read: a retry that fails again at once would otherwise look like nothing happened. */
const FEEDBACK_MS = 1200;

/**
 * Wraps a retry so the viewer sees it was pressed: `isRetrying` stays true for a moment,
 * whatever the player does meanwhile.
 */
export function useRetryFeedback(retry: () => void) {
  const [isRetrying, setIsRetrying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const retryWithFeedback = useCallback(() => {
    clearTimeout(timer.current);
    setIsRetrying(true);
    timer.current = setTimeout(() => setIsRetrying(false), FEEDBACK_MS);
    retry();
  }, [retry]);

  return { isRetrying, retryWithFeedback };
}
