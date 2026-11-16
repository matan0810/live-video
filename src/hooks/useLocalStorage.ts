import { useCallback, useState } from 'react';

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch {
    return fallback;
  }
}

/** `useState` that survives reloads. Storage failures (private mode, quota) are ignored. */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));

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
