import { useRef } from 'react';
import { useI18n } from '../i18n/context';
import { LANGUAGES } from '../i18n/strings';
import { THEMES, type Theme } from '../theme';
import { IconButton } from './IconButton';
import { GearIcon } from './icons';
import { SettingChoice } from './SettingChoice';
import styles from './AboutButton.module.css';

interface SettingsButtonProps {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  isBigScreen: boolean;
  onBigScreen: (isBigScreen: boolean) => void;
}

const LANGUAGE_NAMES = { he: 'עברית', en: 'English' } as const;

/** A gear in the header opening the site's few settings: language, look, big screen. */
export function SettingsButton({ theme, onTheme, isBigScreen, onBigScreen }: SettingsButtonProps) {
  const { t, language, setLanguage } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <IconButton label={t.settings} variant="ghost" onClick={() => dialogRef.current?.showModal()}>
        <GearIcon />
      </IconButton>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="settings-title"
        // A click on the shade around the window closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.body}>
          <h2 id="settings-title" className={styles.title}>
            {t.settings}
          </h2>
          <SettingChoice
            label={t.settingsLanguage}
            value={language}
            options={LANGUAGES.map((id) => ({ id, label: LANGUAGE_NAMES[id], lang: id }))}
            onChange={setLanguage}
          />
          <SettingChoice
            label={t.settingsTheme}
            value={theme}
            options={THEMES.map((id) => ({ id, label: t.themes[id] }))}
            onChange={onTheme}
          />
          <SettingChoice
            label={t.settingsBigScreen}
            hint={t.bigScreenHint}
            value={isBigScreen ? 'on' : 'off'}
            options={[
              { id: 'off', label: t.off },
              { id: 'on', label: t.on },
            ]}
            onChange={(id) => onBigScreen(id === 'on')}
          />
          <div className={styles.footer}>
            <span />
            <button type="button" className={styles.close} onClick={close}>
              {t.close}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
