import { useI18n } from '../i18n/context';
import { AboutButton } from './AboutButton';
import styles from './AppHeader.module.css';

/** The site's name, its version, the about window and the language switch. */
export function AppHeader() {
  const { t, language, setLanguage } = useI18n();
  return (
    <header className={styles.header}>
      <span className={styles.brandDot} aria-hidden="true" />
      <h1 className={styles.brand}>{t.brand}</h1>
      <span className={styles.version}>v{__APP_VERSION__}</span>
      <AboutButton />
      <button
        type="button"
        className={styles.language}
        lang={language === 'he' ? 'en' : 'he'}
        aria-label={t.switchLanguageLabel}
        onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
      >
        {t.switchLanguage}
      </button>
    </header>
  );
}
