import { lazy, Suspense } from 'react';
import { App } from './App';

const ADMIN_HASH = '#/admin';
// The admin area is a separate chunk, so viewers never download it.
const AdminPage = lazy(() => import('./admin/AdminPage'));

/** Shows the site, or the admin area when the address ends with `#/admin` (plus a query). */
export function Root() {
  const { hash } = window.location;
  const isAdmin = hash === ADMIN_HASH || hash.startsWith(`${ADMIN_HASH}?`);
  return isAdmin ? (
    <Suspense fallback={null}>
      <AdminPage />
    </Suspense>
  ) : (
    <App />
  );
}
