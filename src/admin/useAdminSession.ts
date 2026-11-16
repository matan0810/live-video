import { useCallback } from 'react';
import { login } from '../api/client';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STORAGE_KEY = 'live-video:admin-token';

/** The admin's session token, kept in this browser until it expires or they sign out. */
export function useAdminSession() {
  const [token, setToken] = useLocalStorage<string | null>(STORAGE_KEY, null);

  const signIn = useCallback(
    async (password: string) => setToken(await login(password)),
    [setToken],
  );
  const signOut = useCallback(() => setToken(null), [setToken]);

  return { token: typeof token === 'string' ? token : null, signIn, signOut };
}
