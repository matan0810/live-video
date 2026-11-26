import { useI18n } from '../i18n/context';
import type { Theme } from '../theme';
import { AboutButton } from './AboutButton';
import { SettingsButton } from './SettingsButton';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  isBigScreen: boolean;
  onBigScreen: (isBigScreen: boolean) => void;
}

/** The site's name, its version, the about window and the settings. */
export function AppHeader(settings: AppHeaderProps) {
  const { t } = useI18n();
  return (
    <header className={styles.header}>
      <span className={styles.brandDot} aria-hidden="true" />
      <h1 className={styles.brand}>{t.brand}</h1>
      <span className={styles.version}>v{__APP_VERSION__}</span>
      <AboutButton />
      <SettingsButton {...settings} />
    </header>
  );
}
