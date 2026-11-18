import { useI18n } from '../i18n/context';
import styles from './EmptyStage.module.css';

export function EmptyStage() {
  const { t } = useI18n();
  return (
    <div className={styles.empty}>
      <strong className={styles.title}>{t.emptyTitle}</strong>
      <span className={styles.hint}>{t.emptyHint}</span>
    </div>
  );
}
