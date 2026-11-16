import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import styles from './Admin.module.css';

interface LoginFormProps {
  onSignIn: (password: string) => Promise<void>;
}

function describeError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return 'סיסמה שגויה';
  if (error instanceof ApiError && error.status === 429) {
    return 'יותר מדי ניסיונות. נסו שוב בעוד רבע שעה.';
  }
  return 'ההתחברות נכשלה. בדקו את החיבור ונסו שוב.';
}

export function LoginForm({ onSignIn }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSending(true);
    setError(null);
    try {
      await onSignIn(password);
    } catch (caught) {
      setError(describeError(caught));
      setIsSending(false);
    }
  };

  return (
    <form className={styles.login} onSubmit={(event) => void handleSubmit(event)}>
      <h1 className={styles.heading}>כניסת מנהל</h1>
      <label className={styles.field}>
        <span className={styles.label}>סיסמה</span>
        <input
          className={styles.input}
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={isSending}>
        {isSending ? 'מתחבר…' : 'כניסה'}
      </button>
    </form>
  );
}
