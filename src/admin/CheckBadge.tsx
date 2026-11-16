import type { StreamCheckState } from './useStreamChecks';
import styles from './Admin.module.css';

interface CheckBadgeProps {
  state: StreamCheckState | undefined;
}

export function CheckBadge({ state }: CheckBadgeProps) {
  if (state === undefined) return null;
  if (state === 'checking') return <span className={styles.badge}>בודק…</span>;
  return (
    <span className={styles.badge} data-working={state.isWorking}>
      {state.detail}
    </span>
  );
}
