import { useEffect, useState } from 'react';
import styles from './Admin.module.css';

const CONFIRM_MS = 5000;

interface ConfirmButtonProps {
  label: string;
  /** Shown after the first press, for five seconds: what a second press will do. */
  confirmLabel: string;
  /** Red from the start, for deleting; otherwise it turns red only when it asks. */
  isDanger?: boolean;
  onConfirm: () => void;
}

/** Does something that cannot be taken back only on a second press: one stray tap loses nothing. */
export function ConfirmButton({
  label,
  confirmLabel,
  isDanger = false,
  onConfirm,
}: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  return (
    <button
      type="button"
      className={isDanger || isConfirming ? styles.dangerPlain : styles.secondary}
      onClick={() => {
        if (!isConfirming) {
          setIsConfirming(true);
          return;
        }
        setIsConfirming(false);
        onConfirm();
      }}
    >
      {isConfirming ? confirmLabel : label}
    </button>
  );
}
