import { useEffect, useState } from 'react';
import { changesText } from './changesText';
import styles from './Admin.module.css';

const CONFIRM_MS = 5000;

interface DiscardButtonProps {
  /** How many changes would be lost. */
  changes: number;
  onDiscard: () => void;
}

/** Throws away every unsaved change, but only on a second press: one stray tap loses nothing. */
export function DiscardButton({ changes, onDiscard }: DiscardButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  return (
    <button
      type="button"
      className={isConfirming ? styles.danger : styles.secondary}
      onClick={() => {
        if (!isConfirming) {
          setIsConfirming(true);
          return;
        }
        setIsConfirming(false);
        onDiscard();
      }}
    >
      {isConfirming ? `לבטל ${changesText(changes)}? לחצו שוב` : 'ביטול שינויים'}
    </button>
  );
}
