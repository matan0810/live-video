import { API_URL } from '../api/client';
import { AdminDashboard } from './AdminDashboard';
import { LoginForm } from './LoginForm';
import { useAdminSession } from './useAdminSession';
import styles from './Admin.module.css';

/** Entry point of the admin area, reached at `#/admin`. Loaded only when visited. */
export default function AdminPage() {
  const { token, signIn, signOut } = useAdminSession();

  if (!API_URL) {
    return (
      <div className={styles.login}>
        <h1 className={styles.heading}>הניהול לא פעיל</h1>
        <p className={styles.muted}>האתר נבנה בלי כתובת API.</p>
      </div>
    );
  }
  return token ? (
    <AdminDashboard token={token} onSignOut={signOut} />
  ) : (
    <LoginForm onSignIn={signIn} />
  );
}
