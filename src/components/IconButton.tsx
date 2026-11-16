import type { ReactNode } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps {
  /** Accessible name, also shown as the tooltip. */
  label: string;
  onClick: () => void;
  children: ReactNode;
  /** Set for toggle buttons; leave undefined for plain actions. */
  isPressed?: boolean;
  variant?: 'outlined' | 'ghost';
  className?: string;
}

export function IconButton({
  label,
  onClick,
  children,
  isPressed,
  variant = 'outlined',
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
      aria-label={label}
      aria-pressed={isPressed}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
