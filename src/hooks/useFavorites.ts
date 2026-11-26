import { useCallback } from 'react';
import { storedStrings } from './storedValues';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'live-video:favorites';
const NO_FAVORITES: readonly string[] = [];

/** Favourite channel ids, kept in the order they were added. */
export function useFavorites() {
  const [favoriteIds, setStored] = useLocalStorage<readonly string[]>(
    STORAGE_KEY,
    NO_FAVORITES,
    storedStrings,
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
