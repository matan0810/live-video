import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:collapsed-sections';
const NONE: readonly string[] = [];

/** Which channel-list sections the viewer folded away, remembered across visits. */
export function useCollapsedSections() {
  const [stored, setStored] = useLocalStorage<readonly string[]>(STORAGE_KEY, NONE);
  const collapsed = useMemo(
    () => new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []),
    [stored],
  );

  const toggle = useCallback(
    (sectionId: string) => {
      const next = new Set(collapsed);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      setStored([...next]);
    },
    [collapsed, setStored],
  );

  return { collapsed: collapsed as ReadonlySet<string>, toggle };
}
