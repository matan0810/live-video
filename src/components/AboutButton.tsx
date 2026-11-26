import { useRef } from 'react';
import { isAppleMobile } from '../device';
import { isInstalled, useInstallOffer } from '../install';
import { useI18n } from '../i18n/context';
import { IconButton } from './IconButton';
import { InfoIcon } from './icons';
import styles from './AboutButton.module.css';

/**
 * A small button in the header that opens a short welcome: what the site is, a few tips and
 * the keyboard shortcuts. Out of the way for anyone who already knows the site.
 */
export function AboutButton() {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();
  const install = useInstallOffer();
  const showsInstall = !isInstalled() && (install !== null || isAppleMobile());

  return (
    <>
      <IconButton label={t.about} variant="ghost" onClick={() => dialogRef.current?.showModal()}>
        <InfoIcon />
      </IconButton>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="about-title"
        // A click on the shade around the window closes it, as viewers expect.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.body}>
          <h2 id="about-title" className={styles.title}>
            <span className={styles.dot} aria-hidden="true" />
            {t.aboutTitle}
          </h2>
          <p className={styles.intro}>{t.aboutIntro}</p>
          <ul className={styles.tips}>
            {t.aboutTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          {showsInstall && (
            <div className={styles.install}>
              <span>{install ? t.installHint : t.installHintApple}</span>
              {install && (
                <button type="button" className={styles.installButton} onClick={install}>
                  {t.installButton}
                </button>
              )}
            </div>
          )}
          <section className={styles.shortcuts} aria-labelledby="shortcuts-title">
            <h3 id="shortcuts-title" className={styles.subtitle}>
              {t.shortcutsTitle}
            </h3>
            <dl className={styles.keys}>
              {t.shortcuts.map(([keys, action]) => (
                <div key={keys} className={styles.key}>
                  <dt>
                    <kbd dir="ltr">{keys}</kbd>
                  </dt>
                  <dd>{action}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className={styles.footer}>
            <span className={styles.version}>{t.aboutVersion(__APP_VERSION__)}</span>
            <button type="button" className={styles.close} onClick={close}>
              {t.close}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
