import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:favorites';
const NO_FAVORITES: readonly string[] = [];

/** Favourite channel ids, kept in the order they were added. */
export function useFavorites() {
  const [stored, setStored] = useLocalStorage<readonly string[]>(STORAGE_KEY, NO_FAVORITES);
  const favoriteIds = useMemo(
    () => (Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : NO_FAVORITES),
    [stored],
  );

  const toggleFavorite = useCallback(
    (channelId: string) => {
      setStored(
        favoriteIds.includes(channelId)
          ? favoriteIds.filter((id) => id !== channelId)
          : [...favoriteIds, channelId],
      );
    },
    [favoriteIds, setStored],
  );

  return { favoriteIds, toggleFavorite };
}
