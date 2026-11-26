import { useCallback, useState } from 'react';

/** What storage holds, checked by `parse`; the fallback when it is missing, broken or wrong. */
function read<T>(key: string, fallback: T, parse: (stored: unknown) => T | null): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return parse(parsed) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * `useState` that survives reloads. What is read back is checked by `parse` (storage can
 * hold anything), never cast. Storage failures (private mode, quota) are ignored.
 */
export function useLocalStorage<T>(key: string, fallback: T, parse: (stored: unknown) => T | null) {
  const [value, setValue] = useState<T>(() => read(key, fallback, parse));

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Persisting is best-effort; the in-memory value still updates.
      }
    },
    [key],
  );

  return [value, update] as const;
}
