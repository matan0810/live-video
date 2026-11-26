import { useCallback, useMemo } from 'react';
import { storedStrings } from './storedValues';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:collapsed-sections';
const NONE: readonly string[] = [];

/** Which channel-list sections the viewer folded away, remembered across visits. */
export function useCollapsedSections() {
  const [stored, setStored] = useLocalStorage<readonly string[]>(STORAGE_KEY, NONE, storedStrings);
  const collapsed = useMemo<ReadonlySet<string>>(() => new Set(stored), [stored]);

  const toggle = useCallback(
    (sectionId: string) => {
      const next = new Set(collapsed);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      setStored([...next]);
    },
    [collapsed, setStored],
  );

  return { collapsed, toggle };
}
