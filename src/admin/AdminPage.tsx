import { API_URL } from '../api/client';
import { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { readBookmarkletPayload } from './bookmarklet';
import { LoginForm } from './LoginForm';
import { useAdminSession } from './useAdminSession';
import styles from './Admin.module.css';

/** Entry point of the admin area, reached at `#/admin`. Loaded only when visited. */
export default function AdminPage() {
  const { token, signIn, signOut } = useAdminSession();
  // Links the bookmark sent arrive in the address; read them once and tidy the address so a
  // reload does not offer them again.
  const [incoming, setIncoming] = useState(() => {
    const payload = readBookmarkletPayload(window.location.hash);
    if (payload) window.history.replaceState(null, '', '#/admin');
    return payload;
  });

  if (!API_URL) {
    return (
      <div className={styles.login}>
        <h1 className={styles.heading}>הניהול לא פעיל</h1>
        <p className={styles.muted}>האתר נבנה בלי כתובת API.</p>
      </div>
    );
  }
  return token ? (
    <AdminDashboard
      token={token}
      onSignOut={signOut}
      incoming={incoming}
      onDismissIncoming={() => setIncoming(null)}
    />
  ) : (
    <LoginForm onSignIn={signIn} />
  );
}
