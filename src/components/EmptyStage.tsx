import styles from './EmptyStage.module.css';

export function EmptyStage() {
  return (
    <div className={styles.empty}>
      <strong className={styles.title}>מה רואים עכשיו?</strong>
      <span className={styles.hint}>בחרו ערוץ מהרשימה כדי להתחיל לצפות</span>
    </div>
  );
}
