import { MoonIcon } from '../components/icons';
import { useI18n } from '../i18n/context';
import styles from './PlayerControls.module.css';

/** The sleep timer's minutes, in the bar while it runs, so it is never a surprise. */
export function SleepChip({ minutesLeft }: { minutesLeft: number }) {
  const { t } = useI18n();
  return (
    <span
      className={styles.sleep}
      role="timer"
      aria-label={t.sleepChip(minutesLeft)}
      title={t.sleepChip(minutesLeft)}
    >
      <MoonIcon />
      <bdi>{t.sleepShort(minutesLeft)}</bdi>
    </span>
  );
}
