import type { ReactNode } from 'react';
import styles from './PlayerControls.module.css';

interface ControlButtonProps {
  /** Read out and shown as the tooltip; the button itself shows an icon. */
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** A round icon button in the player's bar. */
export function ControlButton({
  label,
  onClick,
  children,
  disabled,
  className,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
