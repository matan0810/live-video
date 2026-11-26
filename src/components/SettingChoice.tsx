import { useId } from 'react';
import styles from './SettingChoice.module.css';

interface SettingChoiceProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: readonly { id: T; label: string; lang?: string }[];
  onChange: (value: T) => void;
}

/** One setting: its name, and its choices side by side, the chosen one marked. */
export function SettingChoice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SettingChoiceProps<T>) {
  const labelId = useId();
  return (
    <div className={styles.setting}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
      <div className={styles.choices} role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            lang={option.lang}
            aria-checked={option.id === value}
            className={styles.choice}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
